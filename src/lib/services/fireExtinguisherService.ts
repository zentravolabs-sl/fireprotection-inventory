// ============================================================
// src/lib/services/fireExtinguisherService.ts
// Service layer for Fire Extinguisher Management Module.
// Handles Unit Tracking, Client Delivery Notes, Refills,
// Assignments, Returns, and Stock Movement ledger entries.
// ============================================================

import { prisma } from "@/lib/prisma";
import type {
  FireExtinguisherUnitStatus,
  FireExtinguisherAssignmentStatus,
  DeliveryStatus,
  RefillStatus,
} from "@/generated/prisma/client";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CreateUnitInput {
  unitCode: string;
  inventoryId: number;
  serialNumber?: string;
  manufactureDate?: Date | string;
  expiryDate?: Date | string;
  notes?: string;
}

export interface UpdateUnitInput {
  id: number;
  serialNumber?: string;
  manufactureDate?: Date | string;
  expiryDate?: Date | string;
  notes?: string;
  status?: FireExtinguisherUnitStatus;
}

export interface CreateDeliveryNoteInput {
  customerId: number;
  deliveryDate?: Date | string;
  deliveryAddress?: string;
  notes?: string;
  unitIds: number[];
}

export interface UpdateDeliveryNoteInput {
  id: number;
  customerId?: number;
  deliveryDate?: Date | string;
  deliveryAddress?: string;
  notes?: string;
  unitIds?: number[];
}

export interface StartRefillInput {
  assignmentId: number;
  receivedDate?: Date | string;
  replacementUnitId?: number;
  notes?: string;
}

export interface CompleteRefillInput {
  refillId: number;
  completedDate?: Date | string;
  notes?: string;
}

export interface ReturnUnitInput {
  assignmentId: number;
  returnedDate?: Date | string;
  notes?: string;
}

export interface AssignUnitInput {
  unitId: number;
  projectId?: number;
  customerId?: number;
  location?: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateDeliveryNo(): Promise<string> {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.deliveryNote.count({
    where: {
      deliveryNo: {
        startsWith: `DN-${todayStr}`,
      },
    },
  });
  const seq = (count + 1).toString().padStart(3, "0");
  return `DN-${todayStr}-${seq}`;
}

/**
  * Finds or allocates an available stock batch for inventory item stock movement records.
  */
async function getStockBatchForInventory(tx: any, inventoryId: number): Promise<number> {
  const batch = await tx.stockBatch.findFirst({
    where: { inventoryId, availableQty: { gt: 0 } },
    orderBy: { receiveDate: "asc" },
  });
  if (batch) return batch.id;

  const anyBatch = await tx.stockBatch.findFirst({
    where: { inventoryId },
    orderBy: { id: "asc" },
  });
  if (anyBatch) return anyBatch.id;

  throw new Error(`No stock batch found for inventory item #${inventoryId}. Please add stock first.`);
}

// ─── 1. Physical Unit Management ──────────────────────────────────────────────

export async function createFireExtinguisherUnitService(input: CreateUnitInput, userId: string) {
  const existingCode = await prisma.fireExtinguisherUnit.findUnique({
    where: { unitCode: input.unitCode.trim() },
  });
  if (existingCode) {
    throw new Error(`Unit code '${input.unitCode}' already exists.`);
  }

  if (input.serialNumber?.trim()) {
    const existingSerial = await prisma.fireExtinguisherUnit.findUnique({
      where: { serialNumber: input.serialNumber.trim() },
    });
    if (existingSerial) {
      throw new Error(`Serial number '${input.serialNumber}' is already registered.`);
    }
  }

  const inventory = await prisma.inventory.findUnique({
    where: { id: input.inventoryId },
  });
  if (!inventory) {
    throw new Error(`Inventory master item #${input.inventoryId} not found.`);
  }

  const unit = await prisma.fireExtinguisherUnit.create({
    data: {
      unitCode: input.unitCode.trim(),
      inventoryId: input.inventoryId,
      serialNumber: input.serialNumber?.trim() || null,
      manufactureDate: input.manufactureDate ? new Date(input.manufactureDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      notes: input.notes?.trim() || null,
      status: "AVAILABLE",
    },
    include: {
      inventory: {
        include: { category: true, subCategory: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "FIRE_EXTINGUISHER_UNIT_CREATED",
      userId,
      metadata: { unitId: unit.id, unitCode: unit.unitCode, inventoryId: unit.inventoryId },
    },
  });

  return unit;
}

export async function updateFireExtinguisherUnitService(input: UpdateUnitInput, userId: string) {
  const existing = await prisma.fireExtinguisherUnit.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    throw new Error(`Fire Extinguisher Unit #${input.id} not found.`);
  }

  if (input.serialNumber?.trim() && input.serialNumber.trim() !== existing.serialNumber) {
    const conflict = await prisma.fireExtinguisherUnit.findUnique({
      where: { serialNumber: input.serialNumber.trim() },
    });
    if (conflict && conflict.id !== input.id) {
      throw new Error(`Serial number '${input.serialNumber}' is already in use.`);
    }
  }

  const updated = await prisma.fireExtinguisherUnit.update({
    where: { id: input.id },
    data: {
      serialNumber: input.serialNumber !== undefined ? (input.serialNumber?.trim() || null) : existing.serialNumber,
      manufactureDate: input.manufactureDate !== undefined ? (input.manufactureDate ? new Date(input.manufactureDate) : null) : existing.manufactureDate,
      expiryDate: input.expiryDate !== undefined ? (input.expiryDate ? new Date(input.expiryDate) : null) : existing.expiryDate,
      notes: input.notes !== undefined ? (input.notes?.trim() || null) : existing.notes,
      status: input.status !== undefined ? input.status : existing.status,
    },
    include: {
      inventory: {
        include: { category: true, subCategory: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "FIRE_EXTINGUISHER_UNIT_UPDATED",
      userId,
      metadata: { unitId: updated.id, unitCode: updated.unitCode, status: updated.status },
    },
  });

  return updated;
}

export async function getFireExtinguisherUnitsService(filters?: {
  search?: string;
  status?: FireExtinguisherUnitStatus | "";
  inventoryId?: number;
}) {
  const where: any = {};

  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { unitCode: { contains: term, mode: "insensitive" } },
      { serialNumber: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
      { inventory: { name: { contains: term, mode: "insensitive" } } },
      { inventory: { itemCode: { contains: term, mode: "insensitive" } } },
    ];
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.inventoryId) {
    where.inventoryId = filters.inventoryId;
  }

  const units = await prisma.fireExtinguisherUnit.findMany({
    where,
    include: {
      inventory: {
        include: { category: true, subCategory: true },
      },
      assignments: {
        where: { status: { in: ["ACTIVE", "UNDER_REFILL"] } },
        include: { project: true, customer: true },
        orderBy: { assignedDate: "desc" },
        take: 1,
      },
    },
    orderBy: { unitCode: "asc" },
  });

  return units;
}

export async function getFireExtinguisherUnitByCodeService(unitCode: string) {
  const unit = await prisma.fireExtinguisherUnit.findUnique({
    where: { unitCode },
    include: {
      inventory: {
        include: { category: true, subCategory: true },
      },
      assignments: {
        include: {
          project: true,
          customer: true,
          refills: {
            include: { replacementUnit: true },
            orderBy: { receivedDate: "desc" },
          },
        },
        orderBy: { assignedDate: "desc" },
      },
      refillRecords: {
        include: {
          assignment: { include: { project: true, customer: true } },
          replacementUnit: true,
        },
        orderBy: { receivedDate: "desc" },
      },
      deliveryItems: {
        include: {
          deliveryNote: {
            include: { customer: true, createdBy: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!unit) {
    throw new Error(`Fire Extinguisher Unit '${unitCode}' not found.`);
  }

  // Fetch Stock Movements for this inventory item
  const movements = await prisma.stockMovement.findMany({
    where: { inventoryId: unit.inventoryId },
    include: { createdByUser: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activeAssignment = unit.assignments.find((a) => a.status === "ACTIVE" || a.status === "UNDER_REFILL");

  let currentLocationStr = "Main Warehouse";
  if (unit.status === "UNDER_REFILL") {
    currentLocationStr = `Under Refill (${activeAssignment?.project?.projectName || activeAssignment?.customer?.companyName || "External"})`;
  } else if (unit.status === "TEMPORARY_REPLACEMENT") {
    currentLocationStr = `Temporary Replacement (${activeAssignment?.project?.projectName || activeAssignment?.customer?.companyName || "Site"})`;
  } else if (activeAssignment?.project) {
    currentLocationStr = `Project: ${activeAssignment.project.projectName} (${activeAssignment.project.projectCode})`;
  } else if (activeAssignment?.customer) {
    currentLocationStr = `Customer: ${activeAssignment.customer.companyName}`;
  } else if (unit.status !== "AVAILABLE") {
    currentLocationStr = `Status: ${unit.status}`;
  }

  return {
    unit,
    activeAssignment,
    currentLocationStr,
    movements,
  };
}

// ─── 2. Direct Assignment Service ──────────────────────────────────────────────

export async function assignFireExtinguisherService(input: AssignUnitInput, userId: string) {
  // Validate exact target assignment: exactly ONE of projectId or customerId
  if ((!input.projectId && !input.customerId) || (input.projectId && input.customerId)) {
    throw new Error("Validation Error: Exactly one target (either Project OR Customer) must be specified.");
  }

  const unit = await prisma.fireExtinguisherUnit.findUnique({
    where: { id: input.unitId },
  });

  if (!unit) {
    throw new Error(`Fire Extinguisher Unit #${input.unitId} not found.`);
  }

  if (unit.status !== "AVAILABLE") {
    throw new Error(`Unit '${unit.unitCode}' cannot be assigned because its current status is '${unit.status}'. Only AVAILABLE units can be assigned.`);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create Assignment
    const assignment = await tx.fireExtinguisherAssignment.create({
      data: {
        fireExtinguisherUnitId: unit.id,
        projectId: input.projectId || null,
        customerId: input.customerId || null,
        assignedDate: new Date(),
        location: input.location?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "ACTIVE",
      },
      include: {
        fireExtinguisherUnit: { include: { inventory: true } },
        project: true,
        customer: true,
      },
    });

    // 2. Update Unit Status
    await tx.fireExtinguisherUnit.update({
      where: { id: unit.id },
      data: { status: "ASSIGNED" },
    });

    // 3. Create StockMovement OUT
    const batchId = await getStockBatchForInventory(tx, unit.inventoryId);
    const targetLabel = assignment.project ? `Project #${assignment.project.projectCode}` : `Customer '${assignment.customer?.companyName}'`;

    await tx.stockMovement.create({
      data: {
        inventoryId: unit.inventoryId,
        stockBatchId: batchId,
        qty: 1,
        movementType: "OUT",
        referenceType: assignment.project ? "PROJECT" : "MANUAL",
        referenceId: assignment.id,
        remarks: `Direct FE Unit Assignment (${unit.unitCode}) to ${targetLabel}`,
        createdBy: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "FIRE_EXTINGUISHER_ASSIGNED",
        userId,
        metadata: { assignmentId: assignment.id, unitCode: unit.unitCode, projectId: input.projectId, customerId: input.customerId },
      },
    });

    return assignment;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 3. Direct Client Delivery Note Service ───────────────────────────────────

export async function createDeliveryNoteService(input: CreateDeliveryNoteInput, userId: string) {
  if (!input.unitIds || input.unitIds.length === 0) {
    throw new Error("At least one Fire Extinguisher Unit must be selected for the delivery note.");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) {
    throw new Error(`Customer #${input.customerId} not found.`);
  }

  // Check selected units are available
  const units = await prisma.fireExtinguisherUnit.findMany({
    where: { id: { in: input.unitIds } },
  });

  if (units.length !== input.unitIds.length) {
    throw new Error("One or more selected Fire Extinguisher Units were not found.");
  }

  for (const u of units) {
    if (u.status !== "AVAILABLE") {
      throw new Error(`Unit '${u.unitCode}' is not available (Status: ${u.status}).`);
    }
  }

  const deliveryNo = await generateDeliveryNo();

  const deliveryNote = await prisma.deliveryNote.create({
    data: {
      deliveryNo,
      customerId: input.customerId,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : new Date(),
      deliveryAddress: input.deliveryAddress?.trim() || customer.address || null,
      notes: input.notes?.trim() || null,
      status: "DRAFT",
      createdById: userId,
      items: {
        create: input.unitIds.map((unitId) => ({
          fireExtinguisherUnitId: unitId,
        })),
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          fireExtinguisherUnit: {
            include: { inventory: true },
          },
        },
      },
      createdBy: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "DELIVERY_NOTE_CREATED",
      userId,
      metadata: { deliveryNoteId: deliveryNote.id, deliveryNo, customerId: input.customerId, unitCount: input.unitIds.length },
    },
  });

  return deliveryNote;
}

export async function updateDeliveryNoteService(input: UpdateDeliveryNoteInput, userId: string) {
  const existing = await prisma.deliveryNote.findUnique({
    where: { id: input.id },
    include: { items: true },
  });

  if (!existing) {
    throw new Error(`Delivery Note #${input.id} not found.`);
  }

  if (existing.status !== "DRAFT") {
    throw new Error(`Delivery Note '${existing.deliveryNo}' cannot be edited because it is in '${existing.status}' status.`);
  }

  return prisma.$transaction(async (tx) => {
    if (input.unitIds && input.unitIds.length > 0) {
      const units = await tx.fireExtinguisherUnit.findMany({
        where: { id: { in: input.unitIds } },
      });
      for (const u of units) {
        if (u.status !== "AVAILABLE") {
          throw new Error(`Unit '${u.unitCode}' is not available (Status: ${u.status}).`);
        }
      }

      await tx.deliveryNoteItem.deleteMany({
        where: { deliveryNoteId: existing.id },
      });
    }

    const updated = await tx.deliveryNote.update({
      where: { id: existing.id },
      data: {
        customerId: input.customerId || existing.customerId,
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : existing.deliveryDate,
        deliveryAddress: input.deliveryAddress !== undefined ? input.deliveryAddress?.trim() || null : existing.deliveryAddress,
        notes: input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
        items: input.unitIds && input.unitIds.length > 0 ? {
          create: input.unitIds.map((fireExtinguisherUnitId) => ({
            fireExtinguisherUnitId,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        items: {
          include: {
            fireExtinguisherUnit: { include: { inventory: true } },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "DELIVERY_NOTE_UPDATED",
        userId,
        metadata: { deliveryNoteId: updated.id, deliveryNo: updated.deliveryNo },
      },
    });

    return updated;
  }, { maxWait: 15000, timeout: 60000 });
}

export async function confirmDeliveryNoteService(deliveryNoteId: number, userId: string) {
  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    include: {
      customer: true,
      items: {
        include: {
          fireExtinguisherUnit: { include: { inventory: true } },
        },
      },
    },
  });

  if (!deliveryNote) {
    throw new Error(`Delivery Note #${deliveryNoteId} not found.`);
  }

  if (deliveryNote.status !== "DRAFT") {
    throw new Error(`Delivery Note '${deliveryNote.deliveryNo}' has status '${deliveryNote.status}' and cannot be confirmed.`);
  }

  if (!deliveryNote.items || deliveryNote.items.length === 0) {
    throw new Error(`Delivery Note '${deliveryNote.deliveryNo}' has no items.`);
  }

  return prisma.$transaction(async (tx) => {
    for (const item of deliveryNote.items) {
      const unit = await tx.fireExtinguisherUnit.findUnique({
        where: { id: item.fireExtinguisherUnitId },
      });

      if (!unit || unit.status !== "AVAILABLE") {
        throw new Error(`Unit '${unit?.unitCode || item.fireExtinguisherUnitId}' is not AVAILABLE (Current status: ${unit?.status || "UNKNOWN"}). Delivery aborted.`);
      }

      // 1. Update Unit Status -> ASSIGNED
      await tx.fireExtinguisherUnit.update({
        where: { id: unit.id },
        data: { status: "ASSIGNED" },
      });

      // 2. Create FireExtinguisherAssignment with CustomerId & ACTIVE status
      await tx.fireExtinguisherAssignment.create({
        data: {
          fireExtinguisherUnitId: unit.id,
          customerId: deliveryNote.customerId,
          assignedDate: new Date(),
          location: deliveryNote.deliveryAddress || deliveryNote.customer.address || "Client Premises",
          status: "ACTIVE",
          notes: `Direct Client Delivery #${deliveryNote.deliveryNo}`,
        },
      });

      // 3. Create StockMovement OUT
      const batchId = await getStockBatchForInventory(tx, unit.inventoryId);
      await tx.stockMovement.create({
        data: {
          inventoryId: unit.inventoryId,
          stockBatchId: batchId,
          qty: 1,
          movementType: "OUT",
          referenceType: "DELIVERY_NOTE",
          referenceId: deliveryNote.id,
          remarks: `Direct Client Delivery #${deliveryNote.deliveryNo} (${unit.unitCode}) to ${deliveryNote.customer.companyName}`,
          createdBy: userId,
        },
      });
    }

    // 4. Update DeliveryNote Status -> DELIVERED
    const updated = await tx.deliveryNote.update({
      where: { id: deliveryNote.id },
      data: { status: "DELIVERED" },
      include: {
        customer: true,
        items: {
          include: {
            fireExtinguisherUnit: { include: { inventory: true } },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "DELIVERY_NOTE_CONFIRMED",
        userId,
        metadata: { deliveryNoteId: deliveryNote.id, deliveryNo: deliveryNote.deliveryNo, unitCount: deliveryNote.items.length },
      },
    });

    return updated;
  }, { maxWait: 15000, timeout: 60000 });
}

export async function cancelDeliveryNoteService(deliveryNoteId: number, userId: string) {
  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
  });

  if (!deliveryNote) {
    throw new Error(`Delivery Note #${deliveryNoteId} not found.`);
  }

  if (deliveryNote.status === "DELIVERED") {
    throw new Error("Delivered Delivery Notes cannot be directly cancelled. Please use return workflows.");
  }

  const updated = await prisma.deliveryNote.update({
    where: { id: deliveryNoteId },
    data: { status: "CANCELLED" },
  });

  await prisma.auditLog.create({
    data: {
      action: "DELIVERY_NOTE_CANCELLED",
      userId,
      metadata: { deliveryNoteId, deliveryNo: deliveryNote.deliveryNo },
    },
  });

  return updated;
}

export async function getDeliveryNotesService(filters?: {
  search?: string;
  customerId?: number;
  status?: DeliveryStatus | "";
}) {
  const where: any = {};

  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { deliveryNo: { contains: term, mode: "insensitive" } },
      { customer: { companyName: { contains: term, mode: "insensitive" } } },
      { deliveryAddress: { contains: term, mode: "insensitive" } },
    ];
  }

  if (filters?.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.deliveryNote.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          fireExtinguisherUnit: { include: { inventory: true } },
        },
      },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeliveryNoteByIdService(id: number) {
  const note = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          fireExtinguisherUnit: { include: { inventory: true } },
        },
      },
      createdBy: true,
    },
  });

  if (!note) {
    throw new Error(`Delivery Note #${id} not found.`);
  }

  return note;
}

// ─── 4. Refill Management Service ─────────────────────────────────────────────

export async function startRefillService(input: StartRefillInput, userId: string) {
  const assignment = await prisma.fireExtinguisherAssignment.findUnique({
    where: { id: input.assignmentId },
    include: {
      fireExtinguisherUnit: { include: { inventory: true } },
      project: true,
      customer: true,
    },
  });

  if (!assignment) {
    throw new Error(`Fire Extinguisher Assignment #${input.assignmentId} not found.`);
  }

  if (assignment.status !== "ACTIVE") {
    throw new Error(`Assignment #${assignment.id} is currently in '${assignment.status}' status. Only ACTIVE assignments can be sent for refill.`);
  }

  const originalUnit = assignment.fireExtinguisherUnit;

  // Validate replacement unit if selected
  let replacementUnit: any = null;
  if (input.replacementUnitId) {
    if (input.replacementUnitId === originalUnit.id) {
      throw new Error("Replacement unit cannot be the same physical unit as the one being refilled.");
    }
    replacementUnit = await prisma.fireExtinguisherUnit.findUnique({
      where: { id: input.replacementUnitId },
      include: { inventory: true },
    });
    if (!replacementUnit || replacementUnit.status !== "AVAILABLE") {
      throw new Error(`Selected replacement unit #${input.replacementUnitId} is not AVAILABLE (Status: ${replacementUnit?.status || "UNKNOWN"}).`);
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Update Original Unit & Assignment Status -> UNDER_REFILL
    await tx.fireExtinguisherUnit.update({
      where: { id: originalUnit.id },
      data: { status: "UNDER_REFILL" },
    });

    await tx.fireExtinguisherAssignment.update({
      where: { id: assignment.id },
      data: { status: "UNDER_REFILL" },
    });

    // 2. Create ExtinguisherRefill Record
    const refill = await tx.extinguisherRefill.create({
      data: {
        fireExtinguisherAssignmentId: assignment.id,
        fireExtinguisherUnitId: originalUnit.id,
        receivedDate: input.receivedDate ? new Date(input.receivedDate) : new Date(),
        status: "RECEIVED",
        replacementUnitId: replacementUnit ? replacementUnit.id : null,
        notes: input.notes?.trim() || null,
      },
    });

    // 3. Handle Temporary Replacement Unit (if requested)
    if (replacementUnit) {
      await tx.fireExtinguisherUnit.update({
        where: { id: replacementUnit.id },
        data: { status: "TEMPORARY_REPLACEMENT" },
      });

      // Temporary assignment to the same Project or Customer
      const tempAssignment = await tx.fireExtinguisherAssignment.create({
        data: {
          fireExtinguisherUnitId: replacementUnit.id,
          projectId: assignment.projectId,
          customerId: assignment.customerId,
          assignedDate: new Date(),
          location: assignment.location || "Site Replacement",
          status: "ACTIVE",
          notes: `Temporary replacement for refilling Unit #${originalUnit.unitCode} (Refill #${refill.id})`,
        },
      });

      // StockMovement OUT for replacement unit
      const batchId = await getStockBatchForInventory(tx, replacementUnit.inventoryId);
      const siteLabel = assignment.project ? `Project #${assignment.project.projectCode}` : `Customer '${assignment.customer?.companyName}'`;
      await tx.stockMovement.create({
        data: {
          inventoryId: replacementUnit.inventoryId,
          stockBatchId: batchId,
          qty: 1,
          movementType: "OUT",
          referenceType: "FIRE_EXTINGUISHER_REFILL",
          referenceId: refill.id,
          remarks: `Temporary replacement unit #${replacementUnit.unitCode} issued for Refill #${refill.id} at ${siteLabel}`,
          createdBy: userId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "FIRE_EXTINGUISHER_REFILL_STARTED",
        userId,
        metadata: { refillId: refill.id, unitCode: originalUnit.unitCode, replacementUnitId: replacementUnit?.id },
      },
    });

    return refill;
  }, { maxWait: 15000, timeout: 60000 });
}

export async function completeRefillService(input: CompleteRefillInput, userId: string) {
  const refill = await prisma.extinguisherRefill.findUnique({
    where: { id: input.refillId },
    include: {
      assignment: {
        include: { project: true, customer: true },
      },
      fireExtinguisherUnit: true,
      replacementUnit: true,
    },
  });

  if (!refill) {
    throw new Error(`Refill record #${input.refillId} not found.`);
  }

  if (refill.status === "COMPLETED") {
    throw new Error(`Refill record #${refill.id} is already completed.`);
  }

  const originalUnit = refill.fireExtinguisherUnit;
  const assignment = refill.assignment;
  const replacementUnit = refill.replacementUnit;

  return prisma.$transaction(async (tx) => {
    const completedDate = input.completedDate ? new Date(input.completedDate) : new Date();

    // 1. Mark ExtinguisherRefill COMPLETED
    await tx.extinguisherRefill.update({
      where: { id: refill.id },
      data: {
        status: "COMPLETED",
        completedDate,
        notes: input.notes?.trim() || refill.notes,
      },
    });

    // 2. Restore Original Unit & Assignment to ASSIGNED / ACTIVE
    await tx.fireExtinguisherUnit.update({
      where: { id: originalUnit.id },
      data: { status: "ASSIGNED" },
    });

    await tx.fireExtinguisherAssignment.update({
      where: { id: assignment.id },
      data: { status: "ACTIVE" },
    });

    // 3. Return Temporary Replacement Unit to Warehouse (if used)
    if (replacementUnit) {
      // Find active temporary assignment for replacement unit
      const tempAssignment = await tx.fireExtinguisherAssignment.findFirst({
        where: {
          fireExtinguisherUnitId: replacementUnit.id,
          status: "ACTIVE",
          notes: { contains: `Refill #${refill.id}` },
        },
      });

      if (tempAssignment) {
        await tx.fireExtinguisherAssignment.update({
          where: { id: tempAssignment.id },
          data: {
            status: "COMPLETED",
            returnedDate: completedDate,
          },
        });
      }

      await tx.fireExtinguisherUnit.update({
        where: { id: replacementUnit.id },
        data: { status: "AVAILABLE" },
      });

      // StockMovement IN for replacement unit returning to warehouse
      const batchId = await getStockBatchForInventory(tx, replacementUnit.inventoryId);
      await tx.stockMovement.create({
        data: {
          inventoryId: replacementUnit.inventoryId,
          stockBatchId: batchId,
          qty: 1,
          movementType: "IN",
          referenceType: "FIRE_EXTINGUISHER_REFILL",
          referenceId: refill.id,
          remarks: `Temporary replacement unit #${replacementUnit.unitCode} returned to warehouse on refill completion #${refill.id}`,
          createdBy: userId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "FIRE_EXTINGUISHER_REFILL_COMPLETED",
        userId,
        metadata: { refillId: refill.id, originalUnitCode: originalUnit.unitCode, replacementUnitCode: replacementUnit?.unitCode },
      },
    });

    return refill;
  }, { maxWait: 15000, timeout: 60000 });
}

export async function getRefillsService(statusTab?: "UNDER_REFILL" | "HISTORY" | "COMPLETED") {
  const where: any = {};

  if (statusTab === "UNDER_REFILL") {
    where.status = { in: ["RECEIVED", "IN_PROGRESS"] };
  } else if (statusTab === "COMPLETED") {
    where.status = "COMPLETED";
  }

  return prisma.extinguisherRefill.findMany({
    where,
    include: {
      assignment: {
        include: { project: true, customer: true },
      },
      fireExtinguisherUnit: {
        include: { inventory: true },
      },
      replacementUnit: {
        include: { inventory: true },
      },
    },
    orderBy: { receivedDate: "desc" },
  });
}

// ─── 5. Return Unit Service ───────────────────────────────────────────────────

export async function returnFireExtinguisherService(input: ReturnUnitInput, userId: string) {
  const assignment = await prisma.fireExtinguisherAssignment.findUnique({
    where: { id: input.assignmentId },
    include: {
      fireExtinguisherUnit: { include: { inventory: true } },
      project: true,
      customer: true,
    },
  });

  if (!assignment) {
    throw new Error(`Assignment #${input.assignmentId} not found.`);
  }

  if (assignment.status === "RETURNED" || assignment.status === "COMPLETED") {
    throw new Error("Assignment is already returned/completed.");
  }

  const unit = assignment.fireExtinguisherUnit;

  return prisma.$transaction(async (tx) => {
    const returnedDate = input.returnedDate ? new Date(input.returnedDate) : new Date();

    // 1. Mark Assignment RETURNED
    await tx.fireExtinguisherAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "RETURNED",
        returnedDate,
        notes: input.notes ? `${assignment.notes || ""}\nReturn Note: ${input.notes}` : assignment.notes,
      },
    });

    // 2. Mark Unit AVAILABLE
    await tx.fireExtinguisherUnit.update({
      where: { id: unit.id },
      data: { status: "AVAILABLE" },
    });

    // 3. Create StockMovement IN
    const batchId = await getStockBatchForInventory(tx, unit.inventoryId);
    const originStr = assignment.project ? `Project #${assignment.project.projectCode}` : `Customer '${assignment.customer?.companyName}'`;
    await tx.stockMovement.create({
      data: {
        inventoryId: unit.inventoryId,
        stockBatchId: batchId,
        qty: 1,
        movementType: "IN",
        referenceType: "FIRE_EXTINGUISHER_RETURN",
        referenceId: assignment.id,
        remarks: `Fire Extinguisher Unit #${unit.unitCode} returned to warehouse from ${originStr}`,
        createdBy: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "FIRE_EXTINGUISHER_RETURNED",
        userId,
        metadata: { assignmentId: assignment.id, unitCode: unit.unitCode },
      },
    });

    return assignment;
  }, { maxWait: 15000, timeout: 60000 });
}

// ─── 6. Unified Assignments Query Service ─────────────────────────────────────

export async function getFireExtinguisherAssignmentsService(filters?: {
  tab?: "ALL" | "PROJECTS" | "CUSTOMERS" | "ACTIVE" | "UNDER_REFILL" | "RETURNED";
  search?: string;
  status?: FireExtinguisherAssignmentStatus | "";
}) {
  const where: any = {};

  if (filters?.tab === "PROJECTS") {
    where.projectId = { not: null };
  } else if (filters?.tab === "CUSTOMERS") {
    where.customerId = { not: null };
  } else if (filters?.tab === "ACTIVE") {
    where.status = "ACTIVE";
  } else if (filters?.tab === "UNDER_REFILL") {
    where.status = "UNDER_REFILL";
  } else if (filters?.tab === "RETURNED") {
    where.status = { in: ["RETURNED", "COMPLETED"] };
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { fireExtinguisherUnit: { unitCode: { contains: term, mode: "insensitive" } } },
      { fireExtinguisherUnit: { serialNumber: { contains: term, mode: "insensitive" } } },
      { fireExtinguisherUnit: { inventory: { name: { contains: term, mode: "insensitive" } } } },
      { project: { projectName: { contains: term, mode: "insensitive" } } },
      { project: { projectCode: { contains: term, mode: "insensitive" } } },
      { customer: { companyName: { contains: term, mode: "insensitive" } } },
      { location: { contains: term, mode: "insensitive" } },
    ];
  }

  return prisma.fireExtinguisherAssignment.findMany({
    where,
    include: {
      fireExtinguisherUnit: {
        include: { inventory: true },
      },
      project: true,
      customer: true,
      refills: {
        orderBy: { receivedDate: "desc" },
        take: 1,
      },
    },
    orderBy: { assignedDate: "desc" },
  });
}

// ─── 7. Dashboard Stats Service ──────────────────────────────────────────────

export async function getFireExtinguisherDashboardStatsService() {
  const [
    availableCount,
    assignedProjectCount,
    assignedCustomerCount,
    underRefillCount,
    tempReplacementCount,
    damagedCount,
    lostCount,
    expiringSoonCount,
    recentRefills,
    recentDeliveries,
  ] = await Promise.all([
    prisma.fireExtinguisherUnit.count({ where: { status: "AVAILABLE" } }),
    prisma.fireExtinguisherAssignment.count({ where: { status: "ACTIVE", projectId: { not: null } } }),
    prisma.fireExtinguisherAssignment.count({ where: { status: "ACTIVE", customerId: { not: null } } }),
    prisma.fireExtinguisherUnit.count({ where: { status: "UNDER_REFILL" } }),
    prisma.fireExtinguisherUnit.count({ where: { status: "TEMPORARY_REPLACEMENT" } }),
    prisma.fireExtinguisherUnit.count({ where: { status: "DAMAGED" } }),
    prisma.fireExtinguisherUnit.count({ where: { status: "LOST" } }),
    prisma.fireExtinguisherUnit.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // within 30 days
        },
      },
    }),
    prisma.extinguisherRefill.findMany({
      take: 5,
      orderBy: { receivedDate: "desc" },
      include: {
        fireExtinguisherUnit: { include: { inventory: true } },
        assignment: { include: { project: true, customer: true } },
      },
    }),
    prisma.deliveryNote.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    }),
  ]);

  return {
    availableCount,
    assignedProjectCount,
    assignedCustomerCount,
    underRefillCount,
    tempReplacementCount,
    damagedCount,
    lostCount,
    expiringSoonCount,
    recentRefills,
    recentDeliveries,
  };
}
