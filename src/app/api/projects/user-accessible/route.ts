// ============================================================
// src/app/api/projects/user-accessible/route.ts
// API Route returning user-accessible projects with stages
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { UserRole } from "@/types/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user || session.user.isActive === false) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role as UserRole;

    const isGlobalRole =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "CEO" ||
      role === "GENERAL_MANAGER" ||
      role === "ACCOUNTANT" ||
      role === "INVENTORY_CONTROLLER" ||
      role === "PURCHASE_ENGINEER" ||
      role === "QS_ENGINEER";

    const where: any = {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    };

    if (!isGlobalRole) {
      where.OR = [
        { projectManagerId: userId },
        { engineers: { some: { engineerId: userId } } },
        { staffAssignments: { some: { userId, status: "ACTIVE" } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectCode: true,
        projectName: true,
        status: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch projects" }, { status: 500 });
  }
}
