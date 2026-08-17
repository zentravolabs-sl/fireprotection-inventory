"use client";

// ============================================================
// src/components/dashboard/engineer/EngineerDashboardClient.tsx
// Assembles the action-oriented Engineer Technical & Site Work Dashboard.
// Includes Welcome Banner, 6 KPI cards, Today's Tasks, My Task Progress,
// My Projects, Upcoming Tasks, Overdue Tasks, My Material Requests,
// Site Issues, Upcoming Inspections, Recent Site Activity, Quick Actions, and Today's Summary.
// ============================================================

import React, { useState, useMemo } from "react";
import {
  EngKpiCardsData,
  EngTodaysTaskItem,
  EngTaskProgressData,
  EngProjectItem,
  EngUpcomingTaskItem,
  EngOverdueTaskItem,
  EngMaterialRequestItem,
  EngSiteIssueItem,
  EngUpcomingInspectionItem,
  EngActivityItem,
  EngTodaysSummaryData,
} from "@/lib/services/engineerDashboardService";

import { EngHeader } from "./EngHeader";
import { EngWelcomeBanner } from "./EngWelcomeBanner";
import { EngKpiCards } from "./EngKpiCards";
import { EngTodaysTasksTable } from "./EngTodaysTasksTable";
import { EngTaskProgressChart } from "./EngTaskProgressChart";
import { EngMyProjectsSection } from "./EngMyProjectsSection";
import { EngUpcomingTasksTable } from "./EngUpcomingTasksTable";
import { EngOverdueTasksTable } from "./EngOverdueTasksTable";
import { EngMaterialRequestsTable } from "./EngMaterialRequestsTable";
import { EngSiteIssuesTable } from "./EngSiteIssuesTable";
import { EngUpcomingInspections } from "./EngUpcomingInspections";
import { EngSiteActivities } from "./EngSiteActivities";
import { EngQuickActionsWidget } from "./EngQuickActionsWidget";
import { EngTodaysSummary } from "./EngTodaysSummary";

interface EngineerDashboardClientProps {
  userName: string;
  userEmail: string;
  kpis: EngKpiCardsData;
  todaysTasks: EngTodaysTaskItem[];
  taskProgress: EngTaskProgressData;
  myProjects: EngProjectItem[];
  upcomingTasks: EngUpcomingTaskItem[];
  overdueTasks: EngOverdueTaskItem[];
  materialRequests: EngMaterialRequestItem[];
  siteIssues: EngSiteIssueItem[];
  upcomingInspections: EngUpcomingInspectionItem[];
  activities: EngActivityItem[];
  todaysSummary: EngTodaysSummaryData;
}

export function EngineerDashboardClient({
  userName,
  userEmail,
  kpis,
  todaysTasks,
  taskProgress,
  myProjects,
  upcomingTasks,
  overdueTasks,
  materialRequests,
  siteIssues,
  upcomingInspections,
  activities,
  todaysSummary,
}: EngineerDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTodaysTasks = useMemo(() => {
    if (!searchQuery.trim()) return todaysTasks;
    const q = searchQuery.toLowerCase();
    return todaysTasks.filter(
      (t) =>
        t.taskName.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.siteLocation.toLowerCase().includes(q)
    );
  }, [todaysTasks, searchQuery]);

  const filteredMyProjects = useMemo(() => {
    if (!searchQuery.trim()) return myProjects;
    const q = searchQuery.toLowerCase();
    return myProjects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.siteLocation.toLowerCase().includes(q)
    );
  }, [myProjects, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* ── 1. HEADER BAR ────────────────────────────────────────────── */}
      <EngHeader
        userName={userName}
        userEmail={userEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── 2. PERSONALIZED WELCOME BANNER ────────────────────────────── */}
      <EngWelcomeBanner
        userName={userName}
        todaysTasksCount={todaysTasks.length}
      />

      {/* ── 3. 6 TECHNICAL KPI CARDS ──────────────────────────────────── */}
      <EngKpiCards data={kpis} />

      {/* ── 4. QUICK ACTIONS SHORTCUTS ────────────────────────────────── */}
      <EngQuickActionsWidget />

      {/* ── 5. TODAY'S TASKS (MOST IMPORTANT SECTION) ─────────────────── */}
      <EngTodaysTasksTable initialTasks={filteredTodaysTasks} />

      {/* ── 6. MY PROJECTS & TASK PROGRESS (GRID) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <EngMyProjectsSection projects={filteredMyProjects} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <EngTaskProgressChart data={taskProgress} />
        </div>
      </div>

      {/* ── 7. UPCOMING TASKS & OVERDUE TASKS (GRID) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <EngUpcomingTasksTable tasks={upcomingTasks} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <EngOverdueTasksTable tasks={overdueTasks} />
        </div>
      </div>

      {/* ── 8. MATERIAL REQUESTS & SITE ISSUES (GRID) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col h-full">
          <EngMaterialRequestsTable requests={materialRequests} />
        </div>
        <div className="lg:col-span-6 flex flex-col h-full">
          <EngSiteIssuesTable issues={siteIssues} />
        </div>
      </div>

      {/* ── 9. UPCOMING INSPECTIONS & SITE ACTIVITIES (GRID) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col h-full">
          <EngUpcomingInspections inspections={upcomingInspections} />
        </div>
        <div className="lg:col-span-6 flex flex-col h-full">
          <EngSiteActivities activities={activities} />
        </div>
      </div>

      {/* ── 10. TODAY'S SUMMARY ───────────────────────────────────────── */}
      <EngTodaysSummary summary={todaysSummary} />
    </div>
  );
}
