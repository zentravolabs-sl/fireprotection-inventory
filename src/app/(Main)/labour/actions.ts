// ============================================================
// src/app/(Main)/labour/actions.ts
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

export interface GetLaboursParams {
  search?: string;
  labourTypeId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GetLaboursResult {
  labours: LabourRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getLabours({
  search,
  labourTypeId,
  isActive,
  page = 1,
  limit = 5,
}: GetLaboursParams = {}): Promise<GetLaboursResult> {
  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (labourTypeId) where.labourTypeId = labourTypeId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { labourCode: { contains: search, mode: "insensitive" } },
      { nic: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, labours] = await Promise.all([
    prisma.labour.count({ where }),
    prisma.labour.findMany({
      where,
      include: {
        labourType: { select: { id: true, name: true } },
        _count: { select: { projectLabours: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    labours: labours as LabourRow[],
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

export async function getActiveLabourTypes() {
  return prisma.labourType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
