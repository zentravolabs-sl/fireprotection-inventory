// ============================================================
// src/lib/services/projectTransferService.ts
// Core Business Logic & ERP Rules for Project Stock Transfer
// ============================================================

import { prisma } from "@/lib/prisma";
import type {
  CreateProjectTransferInput,
  ProjectTransferFilterInput,
} from "@/lib/validations/transfer";
import type { ProjectTransferStatus } from "@/generated/prisma/client";

// ─── Sequence Generator ────────────────────────────────────────────────────────

export async function generateTransferNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.projectTransfer.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `TRF-${year}-${seq}`;
}

// ─── Source Project Stock Query Helper ─────────────────────────────────────────

export async function getAvailableStockForProject(projectId: number) {
  // 1. Available materials assigned to project
  const projectMaterials = await prisma.projectMaterial.findMany({
    where: {
      projectId,
      balanceQty: { gt: 0 },
    },
    include: {
      inventory: {
        select: { id: true, itemCode: true, name: true, unit: true, brand: true },
      },
      materialIssueItem: {
        include: {
          stockBatch: {
            select: { id: true, batchNo: true, unitCost: true },
          },
        },
      },
    },
  });

  // Consolidate materials by inventoryId & batch
  const materialsMap = new Map<string, {
    inventoryId: number;
    stockBatchId: number;
    itemCode: string;
    name: string;
    unit: string;
    batchNo: string;
    unitCost: number;
    availableQty: number;
    projectMaterialId: number;
  }>();

  for (const pm of projectMaterials) {
    const batchId = pm.materialIssueItem?.stockBatchId || 0;
    const key = `${pm.inventoryId}_${batchId}`;
    const existing = materialsMap.get(key);

    if (existing) {
      existing.availableQty += pm.balanceQty;
    } else {
      materialsMap.set(key, {
        inventoryId: pm.inventoryId,
        stockBatchId: batchId,
        itemCode: pm.inventory.itemCode,
        name: pm.inventory.name,
        unit: pm.inventory.unit,
        batchNo: pm.materialIssueItem?.stockBatch?.batchNo || `Batch #${batchId}`,
        unitCost: pm.materialIssueItem?.stockBatch?.unitCost || 0,
        availableQty: pm.balanceQty,
        projectMaterialId: pm.id,
      });
    }
  }

  // 2. Available pipe cut pieces in source project
  const pipeCutPieces = await prisma.pipeCutPiece.findMany({
    where: {
      OR: [
        { projectId },
        { projectId: null, status: "AVAILABLE" },
      ],
      status: "AVAILABLE",
    },
    include: {
      inventory: { select: { id: true, itemCode: true, name: true, unit: true } },
      stockBatch: { select: { id: true, batchNo: true, unitCost: true } },
    },
  });

  // 3. Tools assigned to source project
  const toolAssignments = await prisma.toolAssignment.findMany({
    where: {
      projectId,
      status: "ACTIVE",
    },
    include: {
      items: {
        where: { returnedAt: null },
        include: {
          tool: {
            select: {
              id: true,
              toolCode: true,
              name: true,
              serialNo: true,
              condition: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const activeTools = toolAssignments.flatMap((ta) =>
    ta.items.map((item) => ({
      toolAssignmentItemId: item.id,
      toolId: item.tool.id,
      toolCode: item.tool.toolCode,
      name: item.tool.name,
      serialNo: item.tool.serialNo,
      condition: item.tool.condition,
    }))
  );

  return {
    materials: Array.from(materialsMap.values()),
    pipeCutPieces: pipeCutPieces.map((pc) => ({
      id: pc.id,
      inventoryId: pc.inventoryId,
      stockBatchId: pc.stockBatchId,
      itemCode: pc.inventory.itemCode,
      name: pc.inventory.name,
      pieceLength: pc.pieceLength,
      unit: pc.unit,
      barcode: pc.barcode,
      batchNo: pc.stockBatch?.batchNo || `Batch #${pc.stockBatchId}`,
      unitCost: pc.stockBatch?.unitCost || 0,
    })),
    tools: activeTools,
  };
}

// ─── Source Stock Validation Helper ──────────────────────────────────────────

async function validateSourceStock(
  tx: any,
  fromProjectId: number,
  items: Array<{
    inventoryId?: number | null;
    stockBatchId?: number | null;
    pipeCutPieceId?: number | null;
    toolId?: number | null;
    qty: number;
    unit: string;
  }>
) {
  for (const item of items) {
    if (item.inventoryId) {
      // Material validation with expiry check
      const projectMaterials = await tx.projectMaterial.findMany({
        where: {
          projectId: fromProjectId,
          inventoryId: item.inventoryId,
          ...(item.stockBatchId
            ? { materialIssueItem: { stockBatchId: item.stockBatchId } }
            : {}),
          balanceQty: { gt: 0 },
        },
        include: {
          inventory: { select: { name: true, unit: true } },
          materialIssueItem: {
            include: { stockBatch: true },
          },
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Reject if underlying stock batch is expired
      for (const pm of projectMaterials) {
        const batch = pm.materialIssueItem?.stockBatch;
        if (batch?.expiryDate && new Date(batch.expiryDate) < today) {
          throw new Error(
            `This stock batch (${batch.batchNo || `#${batch.id}`}) has expired and cannot be issued or transferred.`
          );
        }
      }

      const totalAvailable = projectMaterials.reduce(
        (sum: number, pm: any) => sum + pm.balanceQty,
        0
      );

      const itemName = projectMaterials[0]?.inventory?.name || `Item #${item.inventoryId}`;
      const itemUnit = projectMaterials[0]?.inventory?.unit || item.unit;

      if (totalAvailable < item.qty) {
        throw new Error(
          `Insufficient project stock for "${itemName}". Requested: ${item.qty} ${itemUnit}, Available: ${totalAvailable} ${itemUnit}.`
        );
      }
    } else if (item.pipeCutPieceId) {
      // Pipe cut piece validation
      const piece = await tx.pipeCutPiece.findUnique({
        where: { id: item.pipeCutPieceId },
        include: { inventory: { select: { name: true } } },
      });

      if (!piece) {
        throw new Error(`Pipe cut piece #${item.pipeCutPieceId} not found.`);
      }

      if (piece.status !== "AVAILABLE") {
        throw new Error(`Pipe cut piece "${piece.inventory.name}" is not currently AVAILABLE.`);
      }

      if (piece.projectId !== null && piece.projectId !== fromProjectId) {
        throw new Error(
          `Pipe cut piece "${piece.inventory.name}" is assigned to another project.`
        );
      }
    } else if (item.toolId) {
      // Tool validation
      const tool = await tx.tool.findUnique({
        where: { id: item.toolId },
      });

      if (!tool) {
        throw new Error(`Tool #${item.toolId} not found.`);
      }

      const activeItem = await tx.toolAssignmentItem.findFirst({
        where: {
          toolId: item.toolId,
          returnedAt: null,
          toolAssignment: {
            projectId: fromProjectId,
            status: "ACTIVE",
          },
        },
      });

      if (!activeItem) {
        throw new Error(`Tool "${tool.name}" (${tool.toolCode}) is not currently assigned to the source project.`);
      }
    }
  }
}

// ─── 1. Create Transfer ────────────────────────────────────────────────────────

export async function createProjectTransferService(
  input: CreateProjectTransferInput,
  userId: string
) {
  if (input.fromProjectId === input.toProjectId) {
    throw new Error("Source and destination projects must be different.");
  }

  const [fromProject, toProject] = await Promise.all([
    prisma.project.findUnique({ where: { id: input.fromProjectId } }),
    prisma.project.findUnique({ where: { id: input.toProjectId } }),
  ]);

  if (!fromProject) throw new Error("Source project not found.");
  if (!toProject) throw new Error("Destination project not found.");

  if (fromProject.status === "CANCELLED" || fromProject.status === "COMPLETED") {
    throw new Error("Cannot transfer from a completed or cancelled project.");
  }

  const transferNo = await generateTransferNo();

  return prisma.$transaction(
    async (tx) => {
      // Validate source stock
      await validateSourceStock(tx, input.fromProjectId, input.items);

      const transfer = await tx.projectTransfer.create({
        data: {
          transferNo,
          fromProjectId: input.fromProjectId,
          toProjectId: input.toProjectId,
          transferDate: input.transferDate ? new Date(input.transferDate) : new Date(),
          status: "DRAFT",
          requestedById: userId,
          remarks: input.remarks || null,
          items: {
            create: input.items.map((i) => ({
              inventoryId: i.inventoryId ?? null,
              stockBatchId: i.stockBatchId ?? null,
              pipeCutPieceId: i.pipeCutPieceId ?? null,
              toolId: i.toolId ?? null,
              qty: i.qty,
              unit: i.unit,
              unitCost: i.unitCost ?? 0,
              remarks: i.remarks ?? null,
            })),
          },
        },
        include: {
          items: {
            include: {
              inventory: true,
              stockBatch: true,
              pipeCutPiece: true,
              tool: true,
            },
          },
          fromProject: true,
          toProject: true,
          requestedBy: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "PROJECT_TRANSFER_CREATED",
          userId,
          metadata: { transferId: transfer.id, transferNo, fromProjectId: input.fromProjectId, toProjectId: input.toProjectId },
        },
      });

      return transfer;
    },
    { maxWait: 15000, timeout: 60000 }
  );
}

// ─── 2. Submit Transfer ────────────────────────────────────────────────────────

export async function submitProjectTransferService(transferId: number, userId: string) {
  const transfer = await prisma.projectTransfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) throw new Error("Project transfer not found.");

  if (transfer.status !== "DRAFT") {
    throw new Error(`Transfer cannot be submitted because it is currently in '${transfer.status}' status.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.projectTransfer.update({
      where: { id: transferId },
      data: { status: "PENDING" },
    });

    await tx.auditLog.create({
      data: {
        action: "PROJECT_TRANSFER_SUBMITTED",
        userId,
        metadata: { transferId, transferNo: transfer.transferNo },
      },
    });

    return updated;
  });
}

// ─── 3. Approve Transfer ────────────────────────────────────────────────────────

export async function approveProjectTransferService(transferId: number, userId: string) {
  const transfer = await prisma.projectTransfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) throw new Error("Project transfer not found.");

  if (transfer.status !== "PENDING" && transfer.status !== "DRAFT") {
    throw new Error(`Transfer cannot be approved because it is currently in '${transfer.status}' status.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.projectTransfer.update({
      where: { id: transferId },
      data: {
        status: "APPROVED",
        approvedById: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PROJECT_TRANSFER_APPROVED",
        userId,
        metadata: { transferId, transferNo: transfer.transferNo },
      },
    });

    return updated;
  });
}

// ─── 4. Complete Transfer (Atomic Transaction + Idempotency) ────────────────────

export async function completeProjectTransferService(transferId: number, userId: string) {
  const transfer = await prisma.projectTransfer.findUnique({
    where: { id: transferId },
    include: {
      items: {
        include: {
          inventory: true,
          stockBatch: true,
          pipeCutPiece: true,
          tool: true,
        },
      },
      fromProject: true,
      toProject: true,
    },
  });

  if (!transfer) throw new Error("Project transfer not found.");

  // Idempotency Check: Prevent duplicate processing
  if (transfer.status === "COMPLETED") {
    throw new Error("Transfer has already been completed.");
  }

  if (transfer.status === "CANCELLED") {
    throw new Error("Cannot complete a cancelled transfer.");
  }

  return prisma.$transaction(
    async (tx) => {
      // 1. Re-validate available stock in source project inside transaction
      await validateSourceStock(tx, transfer.fromProjectId, transfer.items);

      for (const item of transfer.items) {
        if (item.inventoryId) {
          // ── A. Consumable Material Transfer ──
          let remainingToDeduct = item.qty;

          const sourceProjectMaterials = await tx.projectMaterial.findMany({
            where: {
              projectId: transfer.fromProjectId,
              inventoryId: item.inventoryId,
              ...(item.stockBatchId
                ? { materialIssueItem: { stockBatchId: item.stockBatchId } }
                : {}),
              balanceQty: { gt: 0 },
            },
            orderBy: { createdAt: "asc" },
            include: { materialIssueItem: true },
          });

          for (const pm of sourceProjectMaterials) {
            if (remainingToDeduct <= 0) break;

            const deductQty = Math.min(pm.balanceQty, remainingToDeduct);
            const newReturnedQty = pm.returnedQty;
            const newBalanceQty = pm.balanceQty - deductQty;
            const newStatus = newBalanceQty === 0 ? "FULLY_RETURNED" : "PARTIALLY_RETURNED";

            // Deduct from Source ProjectMaterial
            await tx.projectMaterial.update({
              where: { id: pm.id },
              data: {
                balanceQty: newBalanceQty,
                status: pm.issuedQty === deductQty ? newStatus : pm.status,
              },
            });

            // Create/Increase Destination ProjectMaterial
            await tx.projectMaterial.create({
              data: {
                projectId: transfer.toProjectId,
                inventoryId: item.inventoryId,
                materialIssueItemId: pm.materialIssueItemId,
                issuedQty: deductQty,
                returnedQty: 0,
                balanceQty: deductQty,
                status: "ASSIGNED",
              },
            });

            const effectiveBatchId = item.stockBatchId || pm.materialIssueItem.stockBatchId;

            // Record TWO StockMovement ledger entries: TRANSFER OUT & TRANSFER IN
            await tx.stockMovement.create({
              data: {
                inventoryId: item.inventoryId,
                stockBatchId: effectiveBatchId,
                qty: deductQty,
                movementType: "OUT",
                referenceType: "PROJECT_TRANSFER",
                referenceId: transfer.id,
                remarks: `Project Transfer OUT to ${transfer.toProject.projectCode} (${transfer.transferNo})`,
                createdBy: userId,
              },
            });

            await tx.stockMovement.create({
              data: {
                inventoryId: item.inventoryId,
                stockBatchId: effectiveBatchId,
                qty: deductQty,
                movementType: "IN",
                referenceType: "PROJECT_TRANSFER",
                referenceId: transfer.id,
                remarks: `Project Transfer IN from ${transfer.fromProject.projectCode} (${transfer.transferNo})`,
                createdBy: userId,
              },
            });

            remainingToDeduct -= deductQty;
          }
        } else if (item.pipeCutPieceId) {
          // ── B. Pipe Cut Piece Transfer ──
          const piece = await tx.pipeCutPiece.findUnique({
            where: { id: item.pipeCutPieceId },
          });

          if (!piece) throw new Error(`Pipe cut piece #${item.pipeCutPieceId} not found.`);

          // Update PipeCutPiece ownership to Destination Project
          await tx.pipeCutPiece.update({
            where: { id: piece.id },
            data: {
              projectId: transfer.toProjectId,
            },
          });

          // Append StockMovements (OUT and IN)
          await tx.stockMovement.create({
            data: {
              inventoryId: piece.inventoryId,
              stockBatchId: piece.stockBatchId,
              qty: piece.pieceLength,
              movementType: "OUT",
              referenceType: "PROJECT_TRANSFER",
              referenceId: transfer.id,
              remarks: `Pipe cut piece transferred OUT to ${transfer.toProject.projectCode} (${transfer.transferNo})`,
              createdBy: userId,
            },
          });

          await tx.stockMovement.create({
            data: {
              inventoryId: piece.inventoryId,
              stockBatchId: piece.stockBatchId,
              qty: piece.pieceLength,
              movementType: "IN",
              referenceType: "PROJECT_TRANSFER",
              referenceId: transfer.id,
              remarks: `Pipe cut piece transferred IN from ${transfer.fromProject.projectCode} (${transfer.transferNo})`,
              createdBy: userId,
            },
          });
        } else if (item.toolId) {
          // ── C. Tool Transfer ──
          const activeItem = await tx.toolAssignmentItem.findFirst({
            where: {
              toolId: item.toolId,
              returnedAt: null,
              toolAssignment: {
                projectId: transfer.fromProjectId,
                status: "ACTIVE",
              },
            },
          });

          if (activeItem) {
            // Close active item on Source Project
            await tx.toolAssignmentItem.update({
              where: { id: activeItem.id },
              data: {
                returnedAt: new Date(),
                remarks: `Transferred to Project ${transfer.toProject.projectCode} (${transfer.transferNo})`,
              },
            });
          }

          // Create new ToolAssignment on Destination Project
          const year = new Date().getFullYear();
          const taCount = await tx.toolAssignment.count();
          const seq = (taCount + 1).toString().padStart(4, "0");
          const assignmentNo = `TA-${year}-${seq}`;

          const destinationAssignment = await tx.toolAssignment.create({
            data: {
              assignmentNo,
              projectId: transfer.toProjectId,
              engineerId: userId,
              assignDate: new Date(),
              remarks: `Received via Transfer #${transfer.transferNo} from ${transfer.fromProject.projectCode}`,
              status: "ACTIVE",
              items: {
                create: [
                  {
                    toolId: item.toolId,
                    conditionAtIssue: item.tool?.condition || "Good",
                  },
                ],
              },
            },
          });

          // Log ToolHistory
          await tx.toolHistory.create({
            data: {
              toolId: item.toolId,
              projectId: transfer.toProjectId,
              engineerId: userId,
              action: "ASSIGNED",
              remarks: `Transferred from ${transfer.fromProject.projectCode} to ${transfer.toProject.projectCode} (${transfer.transferNo})`,
              createdBy: userId,
            },
          });

          // Ensure tool status remains InUse
          await tx.tool.update({
            where: { id: item.toolId },
            data: { status: "InUse" },
          });
        }
      }

      // Calculate total transfer monetary value for financial cost allocation
      const totalTransferValue = transfer.items.reduce(
        (sum, item) => sum + item.qty * item.unitCost,
        0
      );

      if (totalTransferValue > 0) {
        const expenseCount = await tx.projectExpense.count();
        const year = new Date().getFullYear();

        // 1. Deduct cost from Source Project (Credit)
        const expNoFrom = `EXP-${year}-${(expenseCount + 1).toString().padStart(4, "0")}`;
        await tx.projectExpense.create({
          data: {
            expenseNo: expNoFrom,
            projectId: transfer.fromProjectId,
            expenseType: "MATERIAL",
            amount: -totalTransferValue,
            expenseDate: new Date(),
            description: `Transfer OUT Credit: Items transferred to ${transfer.toProject.projectCode} (${transfer.transferNo})`,
            referenceNo: transfer.transferNo,
            createdBy: userId,
          },
        });

        // 2. Add cost to Destination Project (Charge)
        const expNoTo = `EXP-${year}-${(expenseCount + 2).toString().padStart(4, "0")}`;
        await tx.projectExpense.create({
          data: {
            expenseNo: expNoTo,
            projectId: transfer.toProjectId,
            expenseType: "MATERIAL",
            amount: totalTransferValue,
            expenseDate: new Date(),
            description: `Transfer IN Charge: Items received from ${transfer.fromProject.projectCode} (${transfer.transferNo})`,
            referenceNo: transfer.transferNo,
            createdBy: userId,
          },
        });
      }

      // Mark Transfer header as COMPLETED
      const completedTransfer = await tx.projectTransfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          approvedById: transfer.approvedById || userId,
        },
        include: {
          items: {
            include: {
              inventory: true,
              stockBatch: true,
              pipeCutPiece: true,
              tool: true,
            },
          },
          fromProject: true,
          toProject: true,
          requestedBy: true,
          approvedBy: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "PROJECT_TRANSFER_COMPLETED",
          userId,
          metadata: { transferId, transferNo: transfer.transferNo, fromProjectId: transfer.fromProjectId, toProjectId: transfer.toProjectId },
        },
      });

      return completedTransfer;
    },
    { maxWait: 15000, timeout: 60000 }
  );
}

// ─── 5. Cancel Transfer ────────────────────────────────────────────────────────

export async function cancelProjectTransferService(transferId: number, userId: string) {
  const transfer = await prisma.projectTransfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) throw new Error("Project transfer not found.");

  if (transfer.status === "COMPLETED") {
    throw new Error("Cannot cancel an already completed transfer.");
  }

  return prisma.$transaction(async (tx) => {
    const cancelled = await tx.projectTransfer.update({
      where: { id: transferId },
      data: { status: "CANCELLED" },
    });

    await tx.auditLog.create({
      data: {
        action: "PROJECT_TRANSFER_CANCELLED",
        userId,
        metadata: { transferId, transferNo: transfer.transferNo },
      },
    });

    return cancelled;
  });
}

// ─── 6. Queries ────────────────────────────────────────────────────────────────

export async function getProjectTransfersService(filters?: ProjectTransferFilterInput) {
  const where: any = {};

  if (filters?.fromProjectId) where.fromProjectId = filters.fromProjectId;
  if (filters?.toProjectId) where.toProjectId = filters.toProjectId;
  if (filters?.status) where.status = filters.status;

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { transferNo: { contains: s, mode: "insensitive" } },
      { fromProject: { projectName: { contains: s, mode: "insensitive" } } },
      { fromProject: { projectCode: { contains: s, mode: "insensitive" } } },
      { toProject: { projectName: { contains: s, mode: "insensitive" } } },
      { toProject: { projectCode: { contains: s, mode: "insensitive" } } },
      { requestedBy: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [transfers, stats] = await Promise.all([
    prisma.projectTransfer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        fromProject: { select: { id: true, projectCode: true, projectName: true } },
        toProject: { select: { id: true, projectCode: true, projectName: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            inventory: { select: { id: true, itemCode: true, name: true, unit: true } },
            pipeCutPiece: { select: { id: true, pieceLength: true, unit: true, barcode: true } },
            tool: { select: { id: true, toolCode: true, name: true } },
          },
        },
      },
    }),
    prisma.projectTransfer.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const counts = {
    DRAFT: 0,
    PENDING: 0,
    APPROVED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  stats.forEach((s) => {
    if (s.status in counts) {
      counts[s.status as ProjectTransferStatus] = s._count.status;
    }
  });

  return { transfers, counts };
}

export async function getProjectTransferByIdService(transferId: number) {
  const transfer = await prisma.projectTransfer.findUnique({
    where: { id: transferId },
    include: {
      fromProject: { select: { id: true, projectCode: true, projectName: true, location: true } },
      toProject: { select: { id: true, projectCode: true, projectName: true, location: true } },
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      approvedBy: { select: { id: true, name: true, email: true, role: true } },
      items: {
        include: {
          inventory: { select: { id: true, itemCode: true, name: true, unit: true, brand: true } },
          stockBatch: { select: { id: true, batchNo: true, unitCost: true } },
          pipeCutPiece: { select: { id: true, pieceLength: true, unit: true, barcode: true } },
          tool: { select: { id: true, toolCode: true, name: true, serialNo: true } },
        },
      },
    },
  });

  if (!transfer) return null;

  const totalValue = transfer.items.reduce(
    (sum, item) => sum + item.qty * item.unitCost,
    0
  );

  return { ...transfer, totalValue };
}
