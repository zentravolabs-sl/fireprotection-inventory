// ============================================================
// src/lib/repositories/materialRequestRepository.ts
// Database repository for Material Requests
// ============================================================

import { prisma } from "@/lib/prisma";
import { MaterialRequestStatus } from "@/types/project";

export async function generateRequestNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.materialRequest.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `MR-${year}-${seq}`;
}

export async function findMaterialRequestById(id: number) {
  return prisma.materialRequest.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          customer: true,
          projectManager: true,
          engineers: { include: { engineer: true } },
        },
      },
      engineer: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      items: {
        include: {
          inventory: {
            select: { id: true, itemCode: true, name: true, unit: true, brand: true },
          },
        },
      },
      issues: {
        include: {
          items: {
            include: {
              inventory: true,
              stockBatch: true,
            },
          },
        },
      },
    },
  });
}

export async function findMaterialRequests(params: {
  search?: string;
  status?: MaterialRequestStatus;
  projectId?: number;
  engineerId?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.status) {
    where.status = params.status;
  }
  if (params.projectId) {
    where.projectId = params.projectId;
  }
  if (params.engineerId) {
    where.engineerId = params.engineerId;
  }
  if (params.search && params.search.trim() !== "") {
    const s = params.search.trim();
    where.OR = [
      { requestNo: { contains: s, mode: "insensitive" } },
      { project: { projectName: { contains: s, mode: "insensitive" } } },
      { project: { projectCode: { contains: s, mode: "insensitive" } } },
      { engineer: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [total, requests] = await Promise.all([
    prisma.materialRequest.count({ where }),
    prisma.materialRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, projectCode: true, projectName: true },
        },
        engineer: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
        items: {
          include: {
            inventory: {
              select: { id: true, itemCode: true, name: true, unit: true, brand: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createMaterialRequest(data: {
  requestNo: string;
  projectId: number;
  engineerId: string;
  remarks?: string | null;
  items: { inventoryId: number; qtyRequested: number }[];
}) {
  return prisma.materialRequest.create({
    data: {
      requestNo: data.requestNo,
      projectId: data.projectId,
      engineerId: data.engineerId,
      remarks: data.remarks,
      status: "PENDING",
      items: {
        create: data.items.map((i) => ({
          inventoryId: i.inventoryId,
          qtyRequested: i.qtyRequested,
          qtyApproved: 0,
          qtyIssued: 0,
        })),
      },
    },
    include: {
      items: true,
    },
  });
}
