// ============================================================
// src/lib/repositories/transportRepository.ts
// Database repository for Project Transport records
// ============================================================

import { prisma } from "@/lib/prisma";
import { TransportStatus } from "@/types/project";

export async function generateTransportNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.projectTransport.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `TRN-${year}-${seq}`;
}

export async function findTransportsByProjectId(projectId: number) {
  return prisma.projectTransport.findMany({
    where: { projectId },
    orderBy: { transportDate: "desc" },
    include: {
      createdByUser: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });
}

export async function createTransportRecord(data: {
  transportNo: string;
  projectId: number;
  transportDate?: Date | null;
  vehicleNumber: string;
  driverName: string;
  transportCompany?: string | null;
  fromLocation: string;
  toLocation: string;
  fuelCost?: number;
  vehicleHireCost?: number;
  loadingCost?: number;
  unloadingCost?: number;
  otherCost?: number;
  totalCost: number;
  remarks?: string | null;
  createdBy: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Create transport record
    const transport = await tx.projectTransport.create({
      data: {
        transportNo: data.transportNo,
        projectId: data.projectId,
        transportDate: data.transportDate || new Date(),
        vehicleNumber: data.vehicleNumber,
        driverName: data.driverName,
        transportCompany: data.transportCompany,
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        fuelCost: data.fuelCost || 0,
        vehicleHireCost: data.vehicleHireCost || 0,
        loadingCost: data.loadingCost || 0,
        unloadingCost: data.unloadingCost || 0,
        otherCost: data.otherCost || 0,
        totalCost: data.totalCost,
        remarks: data.remarks,
        status: "DELIVERED",
        createdBy: data.createdBy,
      },
    });

    // 2. AUTOMATIC EXPENSE CREATION RULE: Create TRANSPORT expense entry automatically
    const expenseCount = await tx.projectExpense.count();
    const year = new Date().getFullYear();
    const expenseSeq = (expenseCount + 1).toString().padStart(4, "0");
    const expenseNo = `EXP-${year}-${expenseSeq}`;

    await tx.projectExpense.create({
      data: {
        expenseNo,
        projectId: data.projectId,
        expenseType: "TRANSPORT",
        amount: data.totalCost,
        expenseDate: data.transportDate || new Date(),
        description: `Project Transport (${transport.transportNo}): ${data.fromLocation} to ${data.toLocation} via ${data.vehicleNumber}`,
        referenceNo: transport.transportNo,
        createdBy: data.createdBy,
      },
    });

    // Log Audit
    await tx.auditLog.create({
      data: {
        userId: data.createdBy,
        action: "PROJECT_TRANSPORT_CREATED",
        metadata: {
          transportId: transport.id,
          transportNo: transport.transportNo,
          totalCost: data.totalCost,
          projectId: data.projectId,
        },
      },
    });

    return transport;
  }, { maxWait: 15000, timeout: 60000 });
}
