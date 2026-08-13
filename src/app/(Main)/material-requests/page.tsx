// ============================================================
// src/app/(Main)/material-requests/page.tsx
// Central Material Requests List & PM/Store Approval Page
// ============================================================

import React from "react";
import { findMaterialRequests } from "@/lib/repositories/materialRequestRepository";
import { MaterialRequestsClientPage } from "./MaterialRequestsClientPage";
import { MaterialRequestStatus } from "@/types/project";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function MaterialRequestsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";
  const status = (searchParams.status as MaterialRequestStatus) || undefined;
  const page = Number(searchParams.page) || 1;

  const result = await findMaterialRequests({
    search,
    status,
    page,
    limit: 10,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Material Requests Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review, approve, and process FIFO material issues for site project requests.
        </p>
      </div>

      <MaterialRequestsClientPage
        requests={result.requests as any}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  );
}
