"use client";

// ============================================================
// src/components/dashboard/general-manager/GeneralManagerDashboardClient.tsx
// Assembles the executive Management Dashboard for GENERAL_MANAGER.
// Includes live search filter, 6 KPI cards, Project Performance chart,
// Project Progress table, Budget vs Actual chart, At-Risk Projects watchlist,
// Recent Management Activities, Pending Approvals, and Management Summary.
// ============================================================

import React, { useState, useMemo } from "react";
import {
  GMKpiCardsData,
  GMProjectPerformancePoint,
  GMProjectProgressItem,
  GMBudgetVsActualItem,
  GMAtRiskProjectItem,
  GMActivityItem,
  GMPendingApprovalsData,
  GMManagementSummaryData,
} from "@/lib/services/generalManagerDashboardService";

import { GMHeader } from "./GMHeader";
import { GMKpiCards } from "./GMKpiCards";
import { GMProjectPerformanceChart } from "./GMProjectPerformanceChart";
import { GMProjectProgressTable } from "./GMProjectProgressTable";
import { GMBudgetVsActualChart } from "./GMBudgetVsActualChart";
import { GMAtRiskProjectsTable } from "./GMAtRiskProjectsTable";
import { GMManagementActivities } from "./GMManagementActivities";
import { GMPendingApprovals } from "./GMPendingApprovals";
import { GMManagementSummary } from "./GMManagementSummary";

interface GeneralManagerDashboardClientProps {
  userName: string;
  userEmail: string;
  kpis: GMKpiCardsData;
  performancePoints: GMProjectPerformancePoint[];
  projectProgress: GMProjectProgressItem[];
  budgetVsActual: GMBudgetVsActualItem[];
  atRiskProjects: GMAtRiskProjectItem[];
  activities: GMActivityItem[];
  pendingApprovals: GMPendingApprovalsData;
  managementSummary: GMManagementSummaryData;
}

export function GeneralManagerDashboardClient({
  userName,
  userEmail,
  kpis,
  performancePoints,
  projectProgress,
  budgetVsActual,
  atRiskProjects,
  activities,
  pendingApprovals,
  managementSummary,
}: GeneralManagerDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Live filtering when search query is entered
  const filteredProjectProgress = useMemo(() => {
    if (!searchQuery.trim()) return projectProgress;
    const q = searchQuery.toLowerCase();
    return projectProgress.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.pmName.toLowerCase().includes(q)
    );
  }, [projectProgress, searchQuery]);

  const filteredAtRiskProjects = useMemo(() => {
    if (!searchQuery.trim()) return atRiskProjects;
    const q = searchQuery.toLowerCase();
    return atRiskProjects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.pmName.toLowerCase().includes(q) ||
        p.riskReason.toLowerCase().includes(q)
    );
  }, [atRiskProjects, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* ── 1. MANAGEMENT HEADER ──────────────────────────────────────── */}
      <GMHeader
        userName={userName}
        userEmail={userEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── 2. 6 EXECUTIVE KPI CARDS ─────────────────────────────────── */}
      <GMKpiCards data={kpis} />

      {/* ── 3. PROJECT PERFORMANCE CHART ─────────────────────────────── */}
      <GMProjectPerformanceChart initialPoints={performancePoints} />

      {/* ── 4. PROJECT PROGRESS & BUDGET VS ACTUAL (GRID) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <GMProjectProgressTable projects={filteredProjectProgress} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <GMBudgetVsActualChart items={budgetVsActual} />
        </div>
      </div>

      {/* ── 5. DELAYED & AT-RISK PROJECTS & PENDING APPROVALS (GRID) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <GMAtRiskProjectsTable projects={filteredAtRiskProjects} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <GMPendingApprovals data={pendingApprovals} />
        </div>
      </div>

      {/* ── 6. RECENT ACTIVITIES & MANAGEMENT SUMMARY (GRID) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <GMManagementActivities activities={activities} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <GMManagementSummary summary={managementSummary} />
        </div>
      </div>
    </div>
  );
}
