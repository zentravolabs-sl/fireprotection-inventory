// ============================================================
// src/app/(Main)/transfers/page.tsx
// Server Page Route for Project Stock Transfers
// ============================================================

import React from "react";
import { prisma } from "@/lib/prisma";
import { getProjectTransfersService } from "@/lib/services/projectTransferService";
import { TransfersClientPage } from "./TransfersClientPage";

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TransfersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [transferResult, projects] = await Promise.all([
    getProjectTransfersService({ page, limit: 5 }),
    prisma.project.findMany({
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
      total={transferResult.total}
      page={transferResult.page}
      limit={transferResult.limit}
      totalPages={transferResult.totalPages}
    />
  );
}
