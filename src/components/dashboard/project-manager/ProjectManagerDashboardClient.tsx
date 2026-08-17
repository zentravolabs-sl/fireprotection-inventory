"use client";

// ============================================================
// src/components/dashboard/project-manager/ProjectManagerDashboardClient.tsx
// Assembles the operational Project Dashboard for PROJECT_MANAGER.
// Includes live search filter, 6 KPI cards, My Projects gallery,
// Project Progress chart, Task Overview, Today's Tasks, Overdue Tasks,
// Team Workload, Material Requests, Project Issues, Upcoming Deadlines,
// Recent Project Activities, Quick Actions, and Project Summary.
// ============================================================

import React, { useState, useMemo } from "react";
import {
  PMKpiCardsData,
  MyProjectItem,
  PMProjectProgressItem,
  PMTaskOverviewData,
  PMTodaysTaskItem,
  PMOverdueTaskItem,
  PMTeamWorkloadItem,
  PMMaterialRequestItem,
  PMProjectIssueItem,
  PMUpcomingDeadlineItem,
  PMActivityItem,
  PMProjectSummaryData,
} from "@/lib/services/projectManagerDashboardService";

import { PMHeader } from "./PMHeader";
import { PMKpiCards } from "./PMKpiCards";
import { MyProjectsSection } from "./MyProjectsSection";
import { PMProjectProgressChart } from "./PMProjectProgressChart";
import { PMTaskOverviewChart } from "./PMTaskOverviewChart";
import { PMTodaysTasksTable } from "./PMTodaysTasksTable";
import { PMOverdueTasksTable } from "./PMOverdueTasksTable";
import { PMTeamWorkloadWidget } from "./PMTeamWorkloadWidget";
import { PMMaterialRequestsTable } from "./PMMaterialRequestsTable";
import { PMProjectIssuesTable } from "./PMProjectIssuesTable";
import { PMUpcomingDeadlines } from "./PMUpcomingDeadlines";
import { PMProjectActivities } from "./PMProjectActivities";
import { PMQuickActionsWidget } from "./PMQuickActionsWidget";
import { PMProjectSummary } from "./PMProjectSummary";

interface ProjectManagerDashboardClientProps {
  userName: string;
  userEmail: string;
  kpis: PMKpiCardsData;
  myProjects: MyProjectItem[];
  projectProgress: PMProjectProgressItem[];
  taskOverview: PMTaskOverviewData;
  todaysTasks: PMTodaysTaskItem[];
  overdueTasks: PMOverdueTaskItem[];
  teamWorkload: PMTeamWorkloadItem[];
  materialRequests: PMMaterialRequestItem[];
  projectIssues: PMProjectIssueItem[];
  upcomingDeadlines: PMUpcomingDeadlineItem[];
  activities: PMActivityItem[];
  projectSummary: PMProjectSummaryData;
}

export function ProjectManagerDashboardClient({
  userName,
  userEmail,
  kpis,
  myProjects,
  projectProgress,
  taskOverview,
  todaysTasks,
  overdueTasks,
  teamWorkload,
  materialRequests,
  projectIssues,
  upcomingDeadlines,
  activities,
  projectSummary,
}: ProjectManagerDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Live filtering when search query is entered
  const filteredMyProjects = useMemo(() => {
    if (!searchQuery.trim()) return myProjects;
    const q = searchQuery.toLowerCase();
    return myProjects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
    );
  }, [myProjects, searchQuery]);

  const filteredTodaysTasks = useMemo(() => {
    if (!searchQuery.trim()) return todaysTasks;
    const q = searchQuery.toLowerCase();
    return todaysTasks.filter(
      (t) =>
        t.taskName.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.assignedEngineer.toLowerCase().includes(q)
    );
  }, [todaysTasks, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* ── 1. HEADER SECTION ────────────────────────────────────────── */}
      <PMHeader
        userName={userName}
        userEmail={userEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── 2. 6 OPERATIONAL KPI CARDS ───────────────────────────────── */}
      <PMKpiCards data={kpis} />

      {/* ── 3. QUICK ACTIONS SHORTCUTS ────────────────────────────────── */}
      <PMQuickActionsWidget />

      {/* ── 4. MY PROJECTS GALLERY ───────────────────────────────────── */}
      <MyProjectsSection projects={filteredMyProjects} />

      {/* ── 5. PROJECT PROGRESS & TASK OVERVIEW (GRID) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <PMProjectProgressChart projects={projectProgress} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <PMTaskOverviewChart data={taskOverview} />
        </div>
      </div>

      {/* ── 6. TODAY'S TASKS & OVERDUE TASKS (GRID) ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <PMTodaysTasksTable tasks={filteredTodaysTasks} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <PMOverdueTasksTable tasks={overdueTasks} />
        </div>
      </div>

      {/* ── 7. TEAM WORKLOAD & MATERIAL REQUESTS (GRID) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col h-full">
          <PMTeamWorkloadWidget engineers={teamWorkload} />
        </div>
        <div className="lg:col-span-6 flex flex-col h-full">
          <PMMaterialRequestsTable requests={materialRequests} />
        </div>
      </div>

      {/* ── 8. PROJECT ISSUES & UPCOMING DEADLINES (GRID) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <PMProjectIssuesTable issues={projectIssues} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <PMUpcomingDeadlines deadlines={upcomingDeadlines} />
        </div>
      </div>

      {/* ── 9. RECENT PROJECT ACTIVITIES & PROJECT SUMMARY (GRID) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <PMProjectActivities activities={activities} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <PMProjectSummary summary={projectSummary} />
        </div>
      </div>
    </div>
  );
}
