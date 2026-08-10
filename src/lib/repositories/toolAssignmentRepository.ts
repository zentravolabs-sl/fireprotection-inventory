// ============================================================
// src/lib/repositories/toolAssignmentRepository.ts
// Database repository for the Tool Assignment Module.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { AssignToolsInput, ReturnToolItemInput } from "@/lib/validations/tool-assignment";

// ─── Sequence Generator ────────────────────────────────────────────────────────

async function generateAssignmentNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.toolAssignment.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `TA-${year}-${seq}`;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Returns all tools with status Available, plus their current active assignment info. */
export async function getAvailableTools() {
  return prisma.tool.findMany({
    where: { status: "Available" },
    orderBy: [{ name: "asc" }],
  });
}

/** Returns all tools with current assignment context for the tool list page. */
export async function getToolsWithAssignmentContext() {
  const tools = await prisma.tool.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      assignmentItems: {
        where: {
          returnedAt: null,
          toolAssignment: { status: "ACTIVE" },
        },
        take: 1,
        include: {
          toolAssignment: {
            include: {
              project: { select: { id: true, projectCode: true, projectName: true, location: true } },
              engineer: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
  return tools;
}

/** Returns all tool assignments for a specific project (with items and tools). */
export async function getProjectToolAssignments(projectId: number) {
  return prisma.toolAssignment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      engineer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          tool: {
            select: {
              id: true,
              toolCode: true,
              name: true,
              serialNo: true,
              condition: true,
              status: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });
}

/** Tool stats for the dashboard. */
export async function getToolDashboardStats() {
  const now = new Date();

  const [available, inUse, maintenance, lost, overdueItems] = await Promise.all([
    prisma.tool.count({ where: { status: "Available" } }),
    prisma.tool.count({ where: { status: "InUse" } }),
    prisma.tool.count({ where: { status: "Maintenance" } }),
    prisma.tool.count({ where: { status: "Lost" } }),
    prisma.toolAssignmentItem.count({
      where: {
        returnedAt: null,
        toolAssignment: {
          status: "ACTIVE",
          expectedReturnDate: { lt: now },
        },
      },
    }),
  ]);

  return { available, inUse, maintenance, lost, overdueReturns: overdueItems };
}

/** Full tool detail with history (for tool detail page). */
export async function getToolWithHistory(toolId: number) {
  return prisma.tool.findUnique({
    where: { id: toolId },
    include: {
      assignmentItems: {
        orderBy: { toolAssignment: { assignDate: "desc" } },
        include: {
          toolAssignment: {
            include: {
              project: { select: { id: true, projectCode: true, projectName: true } },
              engineer: { select: { id: true, name: true } },
            },
          },
        },
      },
      histories: {
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { id: true, projectCode: true, projectName: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      },
    },
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Creates a ToolAssignment with items, updates all tool statuses to InUse,
 * and writes ToolHistory records. All in one transaction.
 */
export async function createToolAssignment(
  data: AssignToolsInput,
  actorId: string
) {
  const assignmentNo = await generateAssignmentNo();

  return prisma.$transaction(async (tx) => {
    // 1. Verify all selected tools are Available
    const tools = await tx.tool.findMany({
      where: { id: { in: data.toolIds } },
      select: { id: true, name: true, status: true, condition: true },
    });

    const unavailable = tools.filter((t) => t.status !== "Available");
    if (unavailable.length > 0) {
      throw new Error(
        `The following tools are not available: ${unavailable.map((t) => t.name).join(", ")}`
      );
    }

    // 2. Create the assignment header
    const assignment = await tx.toolAssignment.create({
      data: {
        assignmentNo,
        projectId: data.projectId,
        engineerId: data.engineerId,
        assignDate: data.assignDate,
        expectedReturnDate: data.expectedReturnDate ?? null,
        remarks: data.remarks ?? null,
        status: "ACTIVE",
      },
    });

    // 3. Create items + update tool status + write history
    for (const tool of tools) {
      await tx.toolAssignmentItem.create({
        data: {
          toolAssignmentId: assignment.id,
          toolId: tool.id,
          conditionAtIssue: tool.condition,
        },
      });

      await tx.tool.update({
        where: { id: tool.id },
        data: { status: "InUse" },
      });

      await tx.toolHistory.create({
        data: {
          toolId: tool.id,
          projectId: data.projectId,
          engineerId: data.engineerId,
          action: "ASSIGNED",
          remarks: data.remarks ?? null,
          createdBy: actorId,
        },
      });
    }

    return assignment;
  });
}

/**
 * Returns a single tool item.
 * - Good     → Tool status = Available, History = RETURNED
 * - Damaged  → Tool status = Maintenance, History = REPAIR
 * - Lost     → Tool status = Lost, History = LOST
 */
export async function returnToolItem(
  data: ReturnToolItemInput,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    // 1. Load the item and its assignment
    const item = await tx.toolAssignmentItem.findUnique({
      where: { id: data.itemId },
      include: {
        tool: true,
        toolAssignment: {
          include: { items: true },
        },
      },
    });

    if (!item) throw new Error("Tool assignment item not found.");
    if (item.returnedAt) throw new Error("This tool has already been returned.");

    // 2. Map return condition to ToolStatus and ToolHistoryAction
    const conditionMap = {
      Good: { status: "Available" as const, historyAction: "RETURNED" as const, toolCondition: "Good" as const },
      Damaged: { status: "Maintenance" as const, historyAction: "REPAIR" as const, toolCondition: "Damaged" as const },
      Lost: { status: "Lost" as const, historyAction: "LOST" as const, toolCondition: "Damaged" as const },
    };

    const mapping = conditionMap[data.condition];

    // 3. Mark the item as returned
    await tx.toolAssignmentItem.update({
      where: { id: data.itemId },
      data: {
        returnedAt: new Date(),
        returnCondition: mapping.toolCondition,
        remarks: data.remarks ?? null,
      },
    });

    // 4. Update tool status and condition
    await tx.tool.update({
      where: { id: item.toolId },
      data: {
        status: mapping.status,
        condition: mapping.toolCondition,
      },
    });

    // 5. Create history record
    await tx.toolHistory.create({
      data: {
        toolId: item.toolId,
        projectId: item.toolAssignment.projectId,
        engineerId: item.toolAssignment.engineerId,
        action: mapping.historyAction,
        remarks: data.remarks ?? null,
        createdBy: actorId,
      },
    });

    // 6. Update assignment status (PARTIALLY_RETURNED or RETURNED)
    const allItems = await tx.toolAssignmentItem.findMany({
      where: { toolAssignmentId: item.toolAssignmentId },
    });
    const allReturned = allItems.every((i) => i.returnedAt !== null);
    const someReturned = allItems.some((i) => i.returnedAt !== null);

    await tx.toolAssignment.update({
      where: { id: item.toolAssignmentId },
      data: {
        status: allReturned
          ? "RETURNED"
          : someReturned
            ? "PARTIALLY_RETURNED"
            : "ACTIVE",
      },
    });

    return { toolId: item.toolId, newStatus: mapping.status };
  });
}
