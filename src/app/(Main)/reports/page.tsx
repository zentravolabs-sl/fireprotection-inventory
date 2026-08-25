// ============================================================
// src/app/(Main)/reports/page.tsx
// Central Fire Protection ERP Reports Page
// ============================================================

import React, { Suspense } from "react";
import {
  getProjectCostSummaryReport,
  getCategoryExpenseReport,
  getTransportReport,
  getEngineerProjectsReport,
  getCustomerProjectsReport,
  getProjectTransferReport,
} from "@/lib/repositories/reportRepository";
import { ReportsClientPage } from "./ReportsClientPage";
import ReportsSkeleton from "./components/ReportsSkeleton";

export const revalidate = 0;

export const dynamic = "force-dynamic";

export default async function ERPReportsPage() {
  const [
    costSummaryReport,
    categoryExpenseReport,
    transportReport,
    engineerReport,
    customerReport,
    transferReport,
  ] = await Promise.all([
    getProjectCostSummaryReport(),
    getCategoryExpenseReport(),
    getTransportReport(),
    getEngineerProjectsReport(),
    getCustomerProjectsReport(),
    getProjectTransferReport(),
  ]);

  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsClientPage
        costSummaryReport={costSummaryReport}
        categoryExpenseReport={categoryExpenseReport}
        transportReport={transportReport}
        engineerReport={engineerReport}
        customerReport={customerReport}
        transferReport={transferReport}
      />
    </Suspense>
  );
}

