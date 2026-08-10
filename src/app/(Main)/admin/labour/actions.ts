// ============================================================
// src/app/(Main)/admin/labour/actions.ts
// Data fetching helpers for the Labour Master admin page.
// ============================================================

import { prisma } from "@/lib/prisma";

export type LabourRow = {
  id: number;
  labourCode: string;
  name: string;
  nic: string | null;
  phone: string | null;
  monthlySalary: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  labourType: { id: number; name: string };
  _count: { projectLabours: number };
};

export async function getLabours(params: {
  search?: string;
  labourTypeId?: number;
  isActive?: boolean;
}): Promise<LabourRow[]> {
  const where: any = {};
  if (params.isActive !== undefined) where.isActive = params.isActive;
  if (params.labourTypeId) where.labourTypeId = params.labourTypeId;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { labourCode: { contains: params.search, mode: "insensitive" } },
      { nic: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return prisma.labour.findMany({
    where,
    include: {
      labourType: { select: { id: true, name: true } },
      _count: { select: { projectLabours: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<LabourRow[]>;
}

export async function getActiveLabourTypes() {
  return prisma.labourType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
