// ============================================================
// src/app/(Main)/dashboard/reports/page.tsx
// Central Fire Protection ERP Reports Page
// ============================================================

import React from "react";
import {
  getProjectCostSummaryReport,
  getCategoryExpenseReport,
  getTransportReport,
  getEngineerProjectsReport,
  getCustomerProjectsReport,
} from "@/lib/repositories/reportRepository";
import { ReportsClientPage } from "./ReportsClientPage";

export const revalidate = 0;

export default async function ERPReportsPage() {
  const [
    costSummaryReport,
    categoryExpenseReport,
    transportReport,
    engineerReport,
    customerReport,
  ] = await Promise.all([
    getProjectCostSummaryReport(),
    getCategoryExpenseReport(),
    getTransportReport(),
    getEngineerProjectsReport(),
    getCustomerProjectsReport(),
  ]);

  return (
    <ReportsClientPage
      costSummaryReport={costSummaryReport}
      categoryExpenseReport={categoryExpenseReport}
      transportReport={transportReport}
      engineerReport={engineerReport}
      customerReport={customerReport}
    />
  );
}
