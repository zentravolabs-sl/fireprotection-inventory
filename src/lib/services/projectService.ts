// ============================================================
// src/lib/services/projectService.ts
// Core Business Logic & ERP Workflow Rules
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  findProjectById,
  findProjects,
  generateProjectCode,
  getDashboardStats,
  assignEngineerToProject,
  removeEngineerFromProject,
  setLeadEngineer,
  updateProjectCosts,
} from "../repositories/projectRepository";
import {
  findMaterialRequestById,
  findMaterialRequests,
  generateRequestNo,
} from "../repositories/materialRequestRepository";
import { generateIssueNo, findProjectMaterials, findMaterialIssuesByProject } from "../repositories/materialIssueRepository";
import { generateReturnNo, findMaterialReturnsByProject } from "../repositories/materialReturnRepository";
import {
  CreateProjectInput,
  AssignStaffInput,
  AssignEngineerInput,
  UpdateProjectCostsInput,
  CreateMaterialRequestInput,
  ApproveMaterialRequestInput,
  IssueMaterialsFIFOInput,
  ReturnMaterialsInput,
} from "../validations/project";
import { ProjectTimelineEvent, ProjectStatus } from "@/types/project";

// ─── Staff Validation Helper ──────────────────────────────────────────────────

async function validateActiveUser(userId: string, expectedRoleName: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, isActive: true, role: true },
  });

  if (!user) {
    throw new Error(`${expectedRoleName} user not found.`);
  }

  if (!user.isActive) {
    throw new Error(`Cannot assign inactive employee (${user.name}).`);
  }

  return user;
}

// ─── 1. Create Project ────────────────────────────────────────────────────────

export async function createProjectService(input: CreateProjectInput, userId: string) {
  await validateActiveUser(input.projectManagerId, "Project Manager");

  const projectCode = await generateProjectCode();

  const estMat = input.estimatedMaterialCost || 0;
  const estLab = input.estimatedLabourCost || 0;
  const estTrn = input.estimatedTransportCost || 0;
  const estEqp = input.estimatedEquipmentCost || 0;
  const estOth = input.estimatedOtherCost || 0;
  const estTot = estMat + estLab + estTrn + estEqp + estOth;

  return prisma.$transaction(
    async (tx) => {
    const project = await tx.project.create({
      data: {
        projectCode,
        projectName: input.projectName,
        customerId: input.customerId,
        projectManagerId: input.projectManagerId,
        location: input.location || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        description: input.description || null,
        projectValue: input.projectValue || 0,
        estimatedMaterialCost: estMat,
        estimatedLabourCost: estLab,
        estimatedTransportCost: estTrn,
        estimatedEquipmentCost: estEqp,
        estimatedOtherCost: estOth,
        estimatedTotalCost: estTot,
        status: "PENDING",
      },
      include: {
        customer: true,
        projectManager: true,
      },
    });

    await tx.projectAssignment.create({
      data: {
        projectId: project.id,
        projectManagerId: input.projectManagerId,
        assignedBy: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PROJECT_CREATED",
        userId,
        metadata: { projectId: project.id, projectCode, projectName: project.projectName },
      },
    });

    return project;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 2. Multi-Engineer Management ─────────────────────────────────────────────

export async function assignEngineerService(input: AssignEngineerInput, userId: string) {
  await validateActiveUser(input.engineerId, "Engineer");
  return assignEngineerToProject({
    projectId: input.projectId,
    engineerId: input.engineerId,
    isLead: input.isLead,
    assignedBy: userId,
  });
}

export async function removeEngineerService(projectId: number, engineerId: string) {
  return removeEngineerFromProject(projectId, engineerId);
}

export async function setLeadEngineerService(projectId: number, engineerId: string) {
  return setLeadEngineer(projectId, engineerId);
}

// ─── 3. Project Cost Management ────────────────────────────────────────────────

export async function updateProjectCostsService(input: UpdateProjectCostsInput) {
  return updateProjectCosts({
    projectId: input.projectId,
    estimatedMaterialCost: input.estimatedMaterialCost,
    estimatedLabourCost: input.estimatedLabourCost,
    estimatedTransportCost: input.estimatedTransportCost,
    estimatedEquipmentCost: input.estimatedEquipmentCost,
    estimatedOtherCost: input.estimatedOtherCost,
  });
}

// ─── 4. Project Status Updates & Start Gate Validation ──────────────────────────

export async function updateProjectStatusService(projectId: number, status: ProjectStatus) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { engineers: true, projectManager: true },
  });

  if (!project) throw new Error("Project not found.");

  // BUSINESS VALIDATION RULE: Cannot start a project without PM and at least 1 Engineer
  if (status === "IN_PROGRESS") {
    if (!project.projectManagerId) {
      throw new Error("Cannot start project: A Project Manager must be assigned first.");
    }
    if (!project.engineers || project.engineers.length === 0) {
      throw new Error("Cannot start project: At least one Engineer must be assigned to the project.");
    }
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
}

// ─── 5. Create Material Request ───────────────────────────────────────────────

export async function createMaterialRequestService(input: CreateMaterialRequestInput, userId: string) {
  await validateActiveUser(input.engineerId, "Engineer");

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    include: { engineers: true },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.status === "COMPLETED" || project.status === "CANCELLED") {
    throw new Error("Cannot request materials for a completed or cancelled project.");
  }

  // Stock check: Engineer cannot request more than available warehouse stock
  for (const item of input.items) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: item.inventoryId },
      include: {
        stockBatches: {
          select: { availableQty: true },
        },
      },
    });

    if (!inventory) {
      throw new Error(`Inventory item #${item.inventoryId} not found.`);
    }

    const availableStock = inventory.stockBatches.reduce((acc, b) => acc + b.availableQty, 0);

    if (item.qtyRequested > availableStock) {
      throw new Error(
        `Requested quantity (${item.qtyRequested} ${inventory.unit}) for item "${inventory.name}" exceeds total available stock (${availableStock} ${inventory.unit}).`
      );
    }
  }

  const requestNo = await generateRequestNo();

  return prisma.$transaction(
    async (tx) => {
    const request = await tx.materialRequest.create({
      data: {
        requestNo,
        projectId: input.projectId,
        engineerId: input.engineerId,
        remarks: input.remarks || null,
        status: "PENDING",
        items: {
          create: input.items.map((i) => ({
            inventoryId: i.inventoryId,
            qtyRequested: i.qtyRequested,
            qtyApproved: 0,
            qtyIssued: 0,
          })),
        },
      },
      include: {
        items: {
          include: { inventory: true },
        },
      },
    });

    // Update project status to MATERIAL_REQUEST if currently PENDING
    if (project.status === "PENDING") {
      await tx.project.update({
        where: { id: input.projectId },
        data: { status: "MATERIAL_REQUEST" },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "MATERIAL_REQUEST_CREATED",
        userId,
        metadata: { requestId: request.id, requestNo, projectId: input.projectId },
      },
    });

    return request;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 6. Approve Material Request (PM Approval) ───────────────────────────────

export async function approveMaterialRequestService(input: ApproveMaterialRequestInput, userId: string) {
  const request = await prisma.materialRequest.findUnique({
    where: { id: input.requestId },
    include: { items: true, project: true },
  });

  if (!request) {
    throw new Error("Material request not found.");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Request cannot be approved because it is currently in '${request.status}' status.`);
  }

  return prisma.$transaction(
    async (tx) => {
    let hasApprovedItem = false;

    for (const itemApproval of input.items) {
      const item = request.items.find((i) => i.id === itemApproval.itemId);
      if (!item) continue;

      if (itemApproval.qtyApproved > item.qtyRequested) {
        throw new Error(`Approved quantity (${itemApproval.qtyApproved}) cannot exceed requested quantity (${item.qtyRequested}).`);
      }

      if (itemApproval.qtyApproved > 0) {
        hasApprovedItem = true;
      }

      await tx.materialRequestItem.update({
        where: { id: item.id },
        data: { qtyApproved: itemApproval.qtyApproved },
      });
    }

    const newRequestStatus = hasApprovedItem ? "APPROVED" : "REJECTED";

    const updatedRequest = await tx.materialRequest.update({
      where: { id: request.id },
      data: {
        status: newRequestStatus,
        remarks: input.remarks || request.remarks,
      },
      include: { items: true },
    });

    if (hasApprovedItem) {
      await tx.project.update({
        where: { id: request.projectId },
        data: { status: "MATERIAL_APPROVED" },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "MATERIAL_REQUEST_APPROVED",
        userId,
        metadata: { requestId: request.id, status: newRequestStatus },
      },
    });

    return updatedRequest;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 7. Issue Materials (FIFO Batch Selection + AUTOMATIC MATERIAL EXPENSE) ─

export async function issueMaterialsFIFOService(input: IssueMaterialsFIFOInput, userId: string) {
  const request = await prisma.materialRequest.findUnique({
    where: { id: input.requestId },
    include: {
      items: {
        include: { inventory: true },
      },
      project: true,
    },
  });

  if (!request) {
    throw new Error("Material request not found.");
  }

  if (request.status !== "APPROVED" && request.status !== "PARTIAL") {
    throw new Error(`Material request status is '${request.status}'. Only APPROVED or PARTIAL requests can be issued.`);
  }

  const issueNo = await generateIssueNo();

  return prisma.$transaction(
    async (tx) => {
    const issueItemsToCreate: {
      stockBatchId: number;
      inventoryId: number;
      qty: number;
      costPrice: number;
      requestItemId: number;
    }[] = [];

    // FIFO Allocation process
    for (const reqItem of request.items) {
      const pendingQtyToIssue = reqItem.qtyApproved - reqItem.qtyIssued;

      if (pendingQtyToIssue <= 0) continue;

      // Find available batches ordered by receiveDate ASC, id ASC (FIFO!)
      const batches = await tx.stockBatch.findMany({
        where: {
          inventoryId: reqItem.inventoryId,
          availableQty: { gt: 0 },
        },
        orderBy: [{ receiveDate: "asc" }, { id: "asc" }],
      });

      let remainingToAllocate = pendingQtyToIssue;

      for (const batch of batches) {
        if (remainingToAllocate <= 0) break;

        const qtyDrawn = Math.min(batch.availableQty, remainingToAllocate);

        // Deduct availableQty from StockBatch
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            availableQty: batch.availableQty - qtyDrawn,
          },
        });

        issueItemsToCreate.push({
          stockBatchId: batch.id,
          inventoryId: reqItem.inventoryId,
          qty: qtyDrawn,
          costPrice: batch.unitCost,
          requestItemId: reqItem.id,
        });

        remainingToAllocate -= qtyDrawn;
      }

      if (remainingToAllocate > 0) {
        const allocated = pendingQtyToIssue - remainingToAllocate;
        throw new Error(
          `Insufficient warehouse stock to complete FIFO issue for item "${reqItem.inventory.name}". Needed: ${pendingQtyToIssue}, Available: ${allocated}.`
        );
      }
    }

    if (issueItemsToCreate.length === 0) {
      throw new Error("No approved items remaining to issue.");
    }

    // Create MaterialIssue Header
    const materialIssue = await tx.materialIssue.create({
      data: {
        issueNo,
        materialRequestId: request.id,
        warehouse: input.warehouse || "Main Warehouse",
        issuedBy: userId,
        issueDate: new Date(),
      },
    });

    let totalMaterialExpenseAmount = 0;

    // Create MaterialIssueItems, StockMovements, and ProjectMaterials
    for (const itemData of issueItemsToCreate) {
      const lineCost = itemData.qty * itemData.costPrice;
      totalMaterialExpenseAmount += lineCost;

      const issueItem = await tx.materialIssueItem.create({
        data: {
          materialIssueId: materialIssue.id,
          stockBatchId: itemData.stockBatchId,
          inventoryId: itemData.inventoryId,
          qty: itemData.qty,
          costPrice: itemData.costPrice,
        },
      });

      // Record StockMovement (Type: OUT, Reference: PROJECT)
      await tx.stockMovement.create({
        data: {
          inventoryId: itemData.inventoryId,
          stockBatchId: itemData.stockBatchId,
          qty: itemData.qty,
          movementType: "OUT",
          referenceType: "PROJECT",
          referenceId: materialIssue.id,
          remarks: `FIFO Issue #${issueNo} for Project #${request.project.projectCode}`,
          createdBy: userId,
        },
      });

      // Insert ProjectMaterial record
      await tx.projectMaterial.create({
        data: {
          projectId: request.projectId,
          inventoryId: itemData.inventoryId,
          materialIssueItemId: issueItem.id,
          issuedQty: itemData.qty,
          returnedQty: 0,
          balanceQty: itemData.qty,
          status: "ASSIGNED",
        },
      });

      // Update MaterialRequestItem.qtyIssued
      const reqItem = request.items.find((i) => i.id === itemData.requestItemId);
      if (reqItem) {
        await tx.materialRequestItem.update({
          where: { id: reqItem.id },
          data: {
            qtyIssued: reqItem.qtyIssued + itemData.qty,
          },
        });
      }
    }

    // AUTOMATIC EXPENSE CREATION RULE: Create MATERIAL expense entry automatically
    const expenseCount = await tx.projectExpense.count();
    const year = new Date().getFullYear();
    const expenseSeq = (expenseCount + 1).toString().padStart(4, "0");
    const expenseNo = `EXP-${year}-${expenseSeq}`;

    await tx.projectExpense.create({
      data: {
        expenseNo,
        projectId: request.projectId,
        expenseType: "MATERIAL",
        amount: totalMaterialExpenseAmount,
        expenseDate: new Date(),
        description: `Automatic Material Expense for FIFO Issue #${issueNo} (Request #${request.requestNo})`,
        referenceNo: issueNo,
        createdBy: userId,
      },
    });

    // Re-check overall request completion
    const updatedReqItems = await tx.materialRequestItem.findMany({
      where: { materialRequestId: request.id },
    });

    const isFullyIssued = updatedReqItems.every((i) => i.qtyIssued >= i.qtyApproved);
    const newReqStatus = isFullyIssued ? "ISSUED" : "PARTIAL";

    await tx.materialRequest.update({
      where: { id: request.id },
      data: { status: newReqStatus },
    });

    // Update project status to IN_PROGRESS
    await tx.project.update({
      where: { id: request.projectId },
      data: { status: "IN_PROGRESS" },
    });

    await tx.auditLog.create({
      data: {
        action: "MATERIAL_ISSUED_FIFO",
        userId,
        metadata: { issueId: materialIssue.id, issueNo, requestId: request.id },
      },
    });

    return materialIssue;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 8. Return Materials (Engineer Return) ────────────────────────────────────

export async function returnMaterialsService(input: ReturnMaterialsInput, userId: string) {
  await validateActiveUser(input.engineerId, "Engineer");

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const returnNo = await generateReturnNo();

  return prisma.$transaction(
    async (tx) => {
    const returnHeader = await tx.materialReturn.create({
      data: {
        returnNo,
        projectId: input.projectId,
        engineerId: input.engineerId,
        returnedDate: new Date(),
        remarks: input.remarks || null,
      },
    });

    for (const returnItem of input.items) {
      const projMaterial = await tx.projectMaterial.findUnique({
        where: { id: returnItem.projectMaterialId },
        include: { materialIssueItem: true },
      });

      if (!projMaterial) {
        throw new Error(`Project material assignment #${returnItem.projectMaterialId} not found.`);
      }

      if (returnItem.qtyReturned > projMaterial.balanceQty) {
        throw new Error(
          `Cannot return quantity (${returnItem.qtyReturned}) greater than remaining assigned balance (${projMaterial.balanceQty}).`
        );
      }

      const newReturnedQty = projMaterial.returnedQty + returnItem.qtyReturned;
      const newBalanceQty = projMaterial.balanceQty - returnItem.qtyReturned;
      const newStatus = newBalanceQty === 0 ? "FULLY_RETURNED" : "PARTIALLY_RETURNED";

      // Update ProjectMaterial
      await tx.projectMaterial.update({
        where: { id: projMaterial.id },
        data: {
          returnedQty: newReturnedQty,
          balanceQty: newBalanceQty,
          status: newStatus,
        },
      });

      // Create MaterialReturnItem
      await tx.materialReturnItem.create({
        data: {
          materialReturnId: returnHeader.id,
          projectMaterialId: projMaterial.id,
          inventoryId: returnItem.inventoryId,
          qtyReturned: returnItem.qtyReturned,
          condition: returnItem.condition,
        },
      });

      // Stock Restoration logic based on condition
      if (returnItem.condition === "GOOD") {
        // Return to warehouse: Increase stock batch availableQty
        await tx.stockBatch.update({
          where: { id: projMaterial.materialIssueItem.stockBatchId },
          data: {
            availableQty: {
              increment: returnItem.qtyReturned,
            },
          },
        });

        // Record StockMovement (Type: RETURN, Reference: RETURN)
        await tx.stockMovement.create({
          data: {
            inventoryId: returnItem.inventoryId,
            stockBatchId: projMaterial.materialIssueItem.stockBatchId,
            qty: returnItem.qtyReturned,
            movementType: "RETURN",
            referenceType: "RETURN",
            referenceId: returnHeader.id,
            remarks: `Material Return #${returnNo} (Condition: GOOD)`,
            createdBy: userId,
          },
        });
      } else {
        // Condition is DAMAGED or SCRAP: Do NOT increase available warehouse stock
        await tx.stockMovement.create({
          data: {
            inventoryId: returnItem.inventoryId,
            stockBatchId: projMaterial.materialIssueItem.stockBatchId,
            qty: returnItem.qtyReturned,
            movementType: "ADJUSTMENT",
            referenceType: "RETURN",
            referenceId: returnHeader.id,
            remarks: `Material Return #${returnNo} (Written off: ${returnItem.condition})`,
            createdBy: userId,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        action: "MATERIAL_RETURN_PROCESSED",
        userId,
        metadata: { returnId: returnHeader.id, returnNo, projectId: input.projectId },
      },
    });

    return returnHeader;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 9. Complete Project Validation ──────────────────────────────────────────

export async function completeProjectService(projectId: number, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      materialRequests: {
        include: { items: true },
      },
      projectMaterials: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.status === "COMPLETED") {
    throw new Error("Project is already completed.");
  }

  // Business Rule 1: All approved requests must be fully issued
  const unissuedRequests = project.materialRequests.filter(
    (r) => r.status === "APPROVED" || r.status === "PARTIAL"
  );

  if (unissuedRequests.length > 0) {
    throw new Error(
      `Cannot complete project: There are ${unissuedRequests.length} material request(s) that are approved but not fully issued.`
    );
  }

  // Check if any request item has pending approved quantity unissued
  for (const req of project.materialRequests) {
    for (const item of req.items) {
      if (item.qtyApproved > item.qtyIssued) {
        throw new Error(
          `Cannot complete project: Material Request ${req.requestNo} has approved items that have not been issued.`
        );
      }
    }
  }

  return prisma.$transaction(
    async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED" },
    });

    await tx.auditLog.create({
      data: {
        action: "PROJECT_COMPLETED",
        userId,
        metadata: { projectId, projectCode: project.projectCode },
      },
    });

    return updated;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 10. Activity Timeline Construction ──────────────────────────────────────

export async function getProjectTimelineService(projectId: number): Promise<ProjectTimelineEvent[]> {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const events: ProjectTimelineEvent[] = [];

  // Project Created
  events.push({
    id: `create-${project.id}`,
    timestamp: project.createdAt,
    title: "Project Created",
    description: `Project ${project.projectCode} (${project.projectName}) created for customer "${project.customer.companyName}".`,
    type: "CREATED",
    user: project.projectManager?.name,
    statusBadge: project.status,
  });

  // Engineers
  if (project.engineers) {
    for (const eng of project.engineers) {
      events.push({
        id: `eng-${eng.id}`,
        timestamp: eng.assignedDate,
        title: eng.isLead ? "Lead Engineer Assigned" : "Engineer Assigned",
        description: `Engineer: ${eng.engineer?.name || "N/A"} (${eng.engineer?.email || ""})`,
        type: "ASSIGNMENT",
        user: eng.assignedByUser?.name,
      });
    }
  }

  // Transports
  if (project.transports) {
    for (const trn of project.transports) {
      events.push({
        id: `trn-${trn.id}`,
        timestamp: trn.transportDate,
        title: `Transport Dispatched (${trn.transportNo})`,
        description: `Driver: ${trn.driverName} (${trn.vehicleNumber}) | From: ${trn.fromLocation} to ${trn.toLocation} | Cost: LKR/USD ${trn.totalCost}`,
        type: "TRANSPORT",
        user: trn.createdByUser?.name,
      });
    }
  }

  // Expenses
  if (project.expenses) {
    for (const exp of project.expenses) {
      events.push({
        id: `exp-${exp.id}`,
        timestamp: exp.expenseDate,
        title: `Expense Recorded (${exp.expenseNo})`,
        description: `Type: ${exp.expenseType} | Amount: LKR/USD ${exp.amount} | ${exp.description || "No description"}`,
        type: "EXPENSE",
        user: exp.createdByUser?.name,
      });
    }
  }

  // Material Requests
  if (project.materialRequests) {
    for (const req of project.materialRequests) {
      events.push({
        id: `req-${req.id}`,
        timestamp: req.createdAt,
        title: `Material Request Submitted (${req.requestNo})`,
        description: `${req.items.length} item(s) requested by ${req.engineer?.name || "Engineer"}.`,
        type: "REQUEST",
        user: req.engineer?.name,
        statusBadge: req.status,
      });

      if (req.status === "APPROVED" || req.status === "ISSUED" || req.status === "PARTIAL") {
        events.push({
          id: `app-${req.id}`,
          timestamp: req.updatedAt,
          title: `Material Request Approved (${req.requestNo})`,
          description: `Approved by Project Manager. Remarks: ${req.remarks || "None"}`,
          type: "APPROVED",
        });
      }
    }
  }

  // Issued Materials
  const issues = await findMaterialIssuesByProject(projectId);
  for (const issue of issues) {
    const totalItems = issue.items.reduce((sum, i) => sum + i.qty, 0);
    events.push({
      id: `iss-${issue.id}`,
      timestamp: issue.issueDate,
      title: `Materials Issued (FIFO) #${issue.issueNo}`,
      description: `Issued ${totalItems} units from warehouse "${issue.warehouse || "Main Warehouse"}".`,
      type: "ISSUED",
      user: issue.issuedByUser?.name,
    });
  }

  // Material Returns
  if (project.materialReturns) {
    for (const ret of project.materialReturns) {
      const totalReturned = ret.items.reduce((sum, i) => sum + i.qtyReturned, 0);
      events.push({
        id: `ret-${ret.id}`,
        timestamp: ret.returnedDate,
        title: `Material Returned #${ret.returnNo}`,
        description: `Returned ${totalReturned} units. Engineer: ${ret.engineer?.name || "N/A"}.`,
        type: "RETURNED",
        user: ret.engineer?.name,
      });
    }
  }

  // Completion
  if (project.status === "COMPLETED") {
    events.push({
      id: `comp-${project.id}`,
      timestamp: project.updatedAt,
      title: "Project Completed",
      description: `Project ${project.projectCode} successfully completed and closed.`,
      type: "COMPLETED",
      statusBadge: "COMPLETED",
    });
  }

  // Sort chronological
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events;
}
