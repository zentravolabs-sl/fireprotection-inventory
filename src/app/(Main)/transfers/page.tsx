// ============================================================
// src/app/(Main)/transfers/page.tsx
// Server Page Route for Project Stock Transfers
// ============================================================

import React from "react";
import { prisma } from "@/lib/prisma";
import { getProjectTransfersService } from "@/lib/services/projectTransferService";
import { TransfersClientPage } from "./TransfersClientPage";

import { getSession } from "@/lib/session";

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TransfersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const session = await getSession();
  const user = session?.user as any;
  const userRole = user?.role;
  const userId = user?.id;

  const [transferResult, projects] = await Promise.all([
    getProjectTransfersService({
      page,
      limit: 5,
      ...(userRole === "ENGINEER" ? { engineerId: userId } : {}),
    }),
    prisma.project.findMany({
      where: userRole === "ENGINEER" ? {
        engineers: { some: { engineerId: userId } },
      } : {},
      select: {
        id: true,
        projectCode: true,
        projectName: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <TransfersClientPage
      initialTransfers={JSON.parse(JSON.stringify(transferResult.transfers))}
      initialCounts={transferResult.counts}
      projects={projects}
      currentUserRole={userRole}
      total={transferResult.total}
      page={transferResult.page}
      limit={transferResult.limit}
      totalPages={transferResult.totalPages}
    />
  );
}
