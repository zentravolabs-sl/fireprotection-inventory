// ============================================================
// src/app/(Main)/dashboard/page.tsx
// Dashboard Page Router — Routes ACCOUNTANT, ENGINEER, PROJECT_MANAGER, GENERAL_MANAGER,
// SUPER_ADMIN, and ADMIN to their respective role dashboards.
// ============================================================

import { requireSession } from "@/lib/session";
import {
  getDashboardKPIs,
  getProjectStatusOverview,
  getProjectProgressData,
  getInventoryOverviewData,
  getFinancialOverviewData,
  getPendingActionsData,
  getRecentProjectsData,
} from "@/lib/services/dashboardService";
import {
  getGMKpiCards,
  getGMProjectPerformance,
  getGMProjectProgress,
  getGMBudgetVsActual,
  getGMAtRiskProjects,
  getGMManagementActivities,
  getGMPendingApprovals,
  getGMManagementSummary,
} from "@/lib/services/generalManagerDashboardService";
import {
  getPMKpiCards,
  getMyProjects,
  getPMProjectProgress,
  getPMTaskOverview,
  getPMTodaysTasks,
  getPMOverdueTasks,
  getPMTeamWorkload,
  getPMMaterialRequests,
  getPMProjectIssues,
  getPMUpcomingDeadlines,
  getPMProjectActivities,
  getPMProjectSummary,
} from "@/lib/services/projectManagerDashboardService";
import {
  getEngineerKpiCards,
  getEngineerTodaysTasks,
  getEngineerTaskProgress,
  getEngineerProjects,
  getEngineerUpcomingTasks,
  getEngineerOverdueTasks,
  getEngineerMaterialRequests,
  getEngineerSiteIssues,
  getEngineerUpcomingInspections,
  getEngineerSiteActivities,
  getEngineerTodaysSummary,
} from "@/lib/services/engineerDashboardService";
import {
  getAccountantKpiCards,
  getRevenueAndExpenses,
  getCashFlow,
  getAccountsReceivable,
  getAccountsPayable,
  getOutstandingInvoices,
  getRecentTransactions,
  getProjectFinancialOverview,
  getExpenseBreakdown,
  getPendingPayments,
  getFinancialAlerts,
  getAccountantFinancialSummary,
} from "@/lib/services/accountantDashboardService";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { GeneralManagerDashboardClient } from "@/components/dashboard/general-manager/GeneralManagerDashboardClient";
import { ProjectManagerDashboardClient } from "@/components/dashboard/project-manager/ProjectManagerDashboardClient";
import { EngineerDashboardClient } from "@/components/dashboard/engineer/EngineerDashboardClient";
import { AccountantDashboardClient } from "@/components/dashboard/accountant/AccountantDashboardClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — FireGuard ERP System",
  description: "Enterprise Financial, Operations & Technical Site Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const user = session.user as {
    id?: string;
    name: string;
    email: string;
    role?: string;
  };

  // ── ACCOUNTANT SPECIFIC FINANCE DASHBOARD ──────────────────────────────────
  if (user.role === "ACCOUNTANT") {
    const [
      accKpis,
      revenueAndExpenses,
      cashFlow,
      receivables,
      payables,
      outstandingInvoices,
      recentTransactions,
      projectFinancials,
      expenseBreakdown,
      pendingPayments,
      alerts,
      summary,
    ] = await Promise.all([
      getAccountantKpiCards("month"),
      getRevenueAndExpenses("monthly"),
      getCashFlow("month"),
      getAccountsReceivable(),
      getAccountsPayable(),
      getOutstandingInvoices(),
      getRecentTransactions(),
      getProjectFinancialOverview(),
      getExpenseBreakdown(),
      getPendingPayments(),
      getFinancialAlerts(),
      getAccountantFinancialSummary("month"),
    ]);

    return (
      <AccountantDashboardClient
        user={user}
        data={{
          kpis: accKpis,
          revenueAndExpenses,
          cashFlow,
          receivables,
          payables,
          outstandingInvoices,
          recentTransactions,
          projectFinancials,
          expenseBreakdown,
          pendingPayments,
          alerts,
          summary,
        }}
      />
    );
  }

  // ── ENGINEER SPECIFIC TECHNICAL & SITE WORK DASHBOARD ─────────────────────
  if (user.role === "ENGINEER") {
    const [
      engKpis,
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
    ] = await Promise.all([
      getEngineerKpiCards(user.id),
      getEngineerTodaysTasks(user.id),
      getEngineerTaskProgress(user.id),
      getEngineerProjects(user.id),
      getEngineerUpcomingTasks(user.id),
      getEngineerOverdueTasks(user.id),
      getEngineerMaterialRequests(user.id),
      getEngineerSiteIssues(user.id),
      getEngineerUpcomingInspections(user.id),
      getEngineerSiteActivities(user.id),
      getEngineerTodaysSummary(user.id),
    ]);

    return (
      <EngineerDashboardClient
        userName={user.name}
        userEmail={user.email}
        kpis={engKpis}
        todaysTasks={todaysTasks}
        taskProgress={taskProgress}
        myProjects={myProjects}
        upcomingTasks={upcomingTasks}
        overdueTasks={overdueTasks}
        materialRequests={materialRequests}
        siteIssues={siteIssues}
        upcomingInspections={upcomingInspections}
        activities={activities}
        todaysSummary={todaysSummary}
      />
    );
  }

  // ── PROJECT_MANAGER SPECIFIC OPERATIONAL DASHBOARD ───────────────────────
  if (user.role === "PROJECT_MANAGER") {
    const [
      pmKpis,
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
    ] = await Promise.all([
      getPMKpiCards(user.id),
      getMyProjects(user.id),
      getPMProjectProgress(user.id, "all"),
      getPMTaskOverview(user.id),
      getPMTodaysTasks(user.id),
      getPMOverdueTasks(user.id),
      getPMTeamWorkload(user.id),
      getPMMaterialRequests(user.id),
      getPMProjectIssues(user.id),
      getPMUpcomingDeadlines(user.id),
      getPMProjectActivities(user.id),
      getPMProjectSummary(user.id),
    ]);

    return (
      <ProjectManagerDashboardClient
        userName={user.name}
        userEmail={user.email}
        kpis={pmKpis}
        myProjects={myProjects}
        projectProgress={projectProgress}
        taskOverview={taskOverview}
        todaysTasks={todaysTasks}
        overdueTasks={overdueTasks}
        teamWorkload={teamWorkload}
        materialRequests={materialRequests}
        projectIssues={projectIssues}
        upcomingDeadlines={upcomingDeadlines}
        activities={activities}
        projectSummary={projectSummary}
      />
    );
  }

  // ── GENERAL_MANAGER & CEO SPECIFIC EXECUTIVE DASHBOARD ───────────────────
  if (user.role === "GENERAL_MANAGER" || user.role === "CEO") {
    const [
      gmKpis,
      performancePoints,
      gmProjectProgress,
      budgetVsActual,
      atRiskProjects,
      activities,
      pendingApprovals,
      managementSummary,
    ] = await Promise.all([
      getGMKpiCards(),
      getGMProjectPerformance("month"),
      getGMProjectProgress(),
      getGMBudgetVsActual("all"),
      getGMAtRiskProjects(),
      getGMManagementActivities(),
      getGMPendingApprovals(),
      getGMManagementSummary(),
    ]);

    return (
      <GeneralManagerDashboardClient
        userName={user.name}
        userEmail={user.email}
        kpis={gmKpis}
        performancePoints={performancePoints}
        projectProgress={gmProjectProgress}
        budgetVsActual={budgetVsActual}
        atRiskProjects={atRiskProjects}
        activities={activities}
        pendingApprovals={pendingApprovals}
        managementSummary={managementSummary}
      />
    );
  }

  // ── SUPER_ADMIN & ADMIN SHARED OPERATIONS DASHBOARD ──────────────────────
  const [
    kpis,
    statusSummary,
    projectProgress,
    inventorySummary,
    financialSummary,
    pendingActions,
    recentProjects,
  ] = await Promise.all([
    getDashboardKPIs(),
    getProjectStatusOverview(),
    getProjectProgressData(),
    getInventoryOverviewData(),
    getFinancialOverviewData(),
    getPendingActionsData(),
    getRecentProjectsData(),
  ]);

  return (
    <DashboardClient
      userName={user.name}
      userEmail={user.email}
      userRole={user.role ?? "USER"}
      kpis={kpis}
      statusSummary={statusSummary}
      projectProgress={projectProgress}
      inventorySummary={inventorySummary}
      financialSummary={financialSummary}
      pendingActions={pendingActions}
      recentProjects={recentProjects}
    />
  );
}
