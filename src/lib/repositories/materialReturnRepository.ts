// ============================================================
// src/lib/repositories/materialReturnRepository.ts
// Database repository for Material Returns
// ============================================================

import { prisma } from "@/lib/prisma";

export async function generateReturnNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.materialReturn.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `RET-${year}-${seq}`;
}

export async function findMaterialReturnsByProject(projectId: number) {
  return prisma.materialReturn.findMany({
    where: { projectId },
    include: {
      engineer: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      items: {
        include: {
          inventory: {
            select: { id: true, itemCode: true, name: true },
          },
        },
      },
    },
    orderBy: { returnedDate: "desc" },
  });
}
