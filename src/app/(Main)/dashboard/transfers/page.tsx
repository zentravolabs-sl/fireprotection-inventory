// ============================================================
// src/app/(Main)/dashboard/transfers/page.tsx
// Server Page Route for Project Stock Transfers
// ============================================================

import React from "react";
import { prisma } from "@/lib/prisma";
import { getProjectTransfersService } from "@/lib/services/projectTransferService";
import { TransfersClientPage } from "./TransfersClientPage";

export default async function TransfersPage() {
  const [{ transfers, counts }, projects] = await Promise.all([
    getProjectTransfersService(),
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
      initialTransfers={JSON.parse(JSON.stringify(transfers))}
      initialCounts={counts}
      projects={projects}
    />
  );
}
