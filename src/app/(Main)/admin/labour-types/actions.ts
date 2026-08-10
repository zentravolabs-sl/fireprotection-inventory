// ============================================================
// src/app/(Main)/admin/labour-types/actions.ts
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

export async function getLabourTypes(): Promise<LabourTypeRow[]> {
  return prisma.labourType.findMany({
    include: { _count: { select: { labours: true } } },
    orderBy: { name: "asc" },
  }) as Promise<LabourTypeRow[]>;
}
