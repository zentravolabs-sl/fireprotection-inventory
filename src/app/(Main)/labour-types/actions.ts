// ============================================================
// src/app/(Main)/labour-types/actions.ts
// Data fetching helpers for the Labour Types admin page.
// ============================================================

import { prisma } from "@/lib/prisma";

export type LabourTypeRow = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { labours: number };
};

export interface GetLabourTypesParams {
  page?: number;
  limit?: number;
}

export interface GetLabourTypesResult {
  labourTypes: LabourTypeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getLabourTypes({
  page = 1,
  limit = 5,
}: GetLabourTypesParams = {}): Promise<GetLabourTypesResult> {
  const [total, labourTypes] = await Promise.all([
    prisma.labourType.count(),
    prisma.labourType.findMany({
      include: { _count: { select: { labours: true } } },
      orderBy: { name: "asc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    labourTypes: labourTypes as LabourTypeRow[],
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}
