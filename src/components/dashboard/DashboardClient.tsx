"use client";

// ============================================================
// src/components/dashboard/DashboardClient.tsx
// Main Enterprise Dashboard Client Component.
// Assembles the core dashboard widgets for SUPER_ADMIN & ADMIN.
// Grid items use equal height alignment (items-stretch + h-full).
// ============================================================

import React, { useState, useMemo } from "react";
import {
  DashboardKPIs,
  ProjectStatusSummary,
  ProjectProgressItem,
  InventoryOverviewSummary,
  FinancialOverviewSummary,
  PendingActionItem,
} from "@/lib/services/dashboardService";

import { DashboardHeader } from "./DashboardHeader";
import { KPICards } from "./KPICards";
import { ProjectOverviewChart } from "./ProjectOverviewChart";
import { ProjectProgressTable } from "./ProjectProgressTable";
import { InventoryOverviewWidget } from "./InventoryOverviewWidget";
import { FinancialOverviewWidget } from "./FinancialOverviewWidget";
import { PendingActionsWidget } from "./PendingActionsWidget";
import { RecentProjectsTable } from "./RecentProjectsTable";
import { FireExtinguisherDashboardWidget } from "./FireExtinguisherDashboardWidget";

interface DashboardClientProps {
  userName: string;
  userEmail: string;
  userRole: string;
  kpis: DashboardKPIs;
  statusSummary: ProjectStatusSummary;
  projectProgress: ProjectProgressItem[];
  inventorySummary: InventoryOverviewSummary;
  financialSummary: FinancialOverviewSummary;
  pendingActions: PendingActionItem[];
  recentProjects: any[];
}

export function DashboardClient({
  userName,
  userEmail,
  userRole,
  kpis,
  statusSummary,
  projectProgress,
  inventorySummary,
  financialSummary,
  pendingActions,
  recentProjects,
}: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Live filter when search query is entered
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

  const filteredRecentProjects = useMemo(() => {
    if (!searchQuery.trim()) return recentProjects;
    const q = searchQuery.toLowerCase();
    return recentProjects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        (p.customer?.companyName && p.customer.companyName.toLowerCase().includes(q))
    );
  }, [recentProjects, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* ── 1. HEADER SECTION ────────────────────────────────────────── */}
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── 2. KPI CARDS SECTION (8 CARDS GRID) ───────────────────────── */}
      <KPICards kpis={kpis} />

      {/* ── FIRE EXTINGUISHER SUMMARY & STATS ─────────────────────────── */}
      <FireExtinguisherDashboardWidget />

      {/* ── 3. PROJECT OVERVIEW & PROJECT PROGRESS (EQUAL HEIGHT GRID) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col h-full">
          <ProjectOverviewChart summary={statusSummary} />
        </div>
        <div className="lg:col-span-7 flex flex-col h-full">
          <ProjectProgressTable projects={filteredProjectProgress} />
        </div>
      </div>

      {/* ── 4. INVENTORY & FINANCIAL OVERVIEW (EQUAL HEIGHT GRID) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col h-full">
          <InventoryOverviewWidget summary={inventorySummary} />
        </div>
        <div className="lg:col-span-7 flex flex-col h-full">
          <FinancialOverviewWidget summary={financialSummary} />
        </div>
      </div>

      {/* ── 5. PENDING ACTIONS WIDGET ─────────────────────────────────── */}
      <div>
        <PendingActionsWidget actions={pendingActions} />
      </div>

      {/* ── 6. RECENT PROJECTS TABLE ─────────────────────────────────── */}
      <RecentProjectsTable projects={filteredRecentProjects} />
    </div>
  );
}
