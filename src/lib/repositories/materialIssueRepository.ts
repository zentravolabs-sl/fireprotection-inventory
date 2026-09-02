// ============================================================
// src/lib/repositories/materialIssueRepository.ts
// Database repository for Material Issue & FIFO Stock Allocations
// ============================================================

import { prisma } from "@/lib/prisma";

export async function generateIssueNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.materialIssue.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `ISS-${year}-${seq}`;
}

export async function findAvailableBatchesFIFO(inventoryId: number) {
  return prisma.stockBatch.findMany({
    where: {
      inventoryId,
      availableQty: { gt: 0 },
    },
    orderBy: [{ receiveDate: "asc" }, { id: "asc" }],
  });
}

export async function findProjectMaterials(projectId: number) {
  return prisma.projectMaterial.findMany({
    where: { projectId },
    include: {
      inventory: {
        select: { id: true, itemCode: true, name: true, brand: true },
      },
      materialIssueItem: {
        include: {
          stockBatch: {
            select: { id: true, batchNo: true, unitCost: true, receiveDate: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findMaterialIssuesByProject(projectId: number) {
  return prisma.materialIssue.findMany({
    where: {
      materialRequest: {
        projectId,
      },
    },
    include: {
      issuedByUser: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      materialRequest: {
        select: { id: true, requestNo: true, projectId: true },
      },
      items: {
        include: {
          inventory: {
            select: { id: true, itemCode: true, name: true },
          },
          stockBatch: {
            select: { id: true, batchNo: true, unitCost: true },
          },
        },
      },
    },
    orderBy: { issueDate: "desc" },
  });
}
