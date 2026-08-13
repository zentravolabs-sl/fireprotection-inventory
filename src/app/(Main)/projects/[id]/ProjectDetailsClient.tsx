"use client";

// ============================================================
// src/app/(Main)/dashboard/projects/[id]/ProjectDetailsClient.tsx
// Redesigned 8-Tab Project Summary Page for Fire Protection ERP
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { MaterialRequestModal } from "@/components/projects/MaterialRequestModal";
import { ApproveRequestModal } from "@/components/projects/ApproveRequestModal";
import { EditMaterialRequestModal } from "@/components/projects/EditMaterialRequestModal";
import { IssueMaterialModal } from "@/components/projects/IssueMaterialModal";
import { ReturnMaterialModal } from "@/components/projects/ReturnMaterialModal";
import { AssignEngineerModal } from "@/components/projects/AssignEngineerModal";
import { LogTransportModal } from "@/components/projects/LogTransportModal";
import { AssignedToolsTab } from "@/components/tools/AssignedToolsTab";
import { AddExpenseModal } from "@/components/projects/AddExpenseModal";
import { UpdateProjectCostsModal } from "@/components/projects/UpdateProjectCostsModal";
import { ProjectLabourTab } from "@/components/labour/ProjectLabourTab";
import { ProjectStaffTab } from "@/components/staff";
import { CreateTransferModal } from "@/components/transfers/CreateTransferModal";
import { TransferDetailModal } from "@/components/transfers/TransferDetailModal";
import { ProjectDeliveryAndIssueNotesTab } from "@/components/projects/ProjectDeliveryAndIssueNotesTab";
import { ScrollableTabs, TabItem } from "@/components/ui/ScrollableTabs";
import {
  completeProjectAction,
  updateProjectStatusAction,
  removeEngineerAction,
  setLeadEngineerAction,
} from "@/app/actions/projects";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/dateUtils";
import { ProjectWithDetails, ProjectTimelineEvent } from "@/types/project";
import { usePermissions } from "@/hooks/usePermissions";

interface ProjectDetailsClientProps {
  project: ProjectWithDetails;
  timeline: ProjectTimelineEvent[];
  inventoryItems: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
    availableStock: number;
  }[];
  users: {
    id: string;
    name: string;
    role: string;
    email: string;
    isActive: boolean;
  }[];
  toolAssignments: any[];
  projectLabours: any[];
  availableLabours: any[];
  projectStaff?: any[];
  projectTransfers?: any[];
  allProjects?: any[];
  currentUserRole?: string;
}

type TabType =
  | "overview"
  | "engineers"
  | "tools"
  | "labour"
  | "staff"
  | "requests"
  | "issues"
  | "notes"
  | "returns"
  | "transport"
  | "transfers"
  | "expenses"
  | "timeline";

export function ProjectDetailsClient({
  project,
  timeline,
  inventoryItems,
  users,
  toolAssignments = [],
  projectLabours = [],
  availableLabours = [],
  projectStaff = [],
  projectTransfers = [],
  allProjects = [],
  currentUserRole = "USER",
}: ProjectDetailsClientProps) {
  const router = useRouter();
  const { can, isSuperAdmin, userRole } = usePermissions();

  const isEngineerRole = currentUserRole === "ENGINEER";
  const isPMRole = currentUserRole === "PROJECT_MANAGER";
  const isRestrictedRole = currentUserRole === "ENGINEER" || currentUserRole === "PROJECT_MANAGER";

  const [activeTab, setActiveTab] = useState<TabType>(
    isEngineerRole || isPMRole ? "requests" : "overview"
  );

  // Modals state
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isAssignEngineerOpen, setIsAssignEngineerOpen] = useState(false);
  const [isLogTransportOpen, setIsLogTransportOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isUpdateCostsOpen, setIsUpdateCostsOpen] = useState(false);

  const [selectedApproveRequest, setSelectedApproveRequest] = useState<any | null>(null);
  const [selectedIssueRequest, setSelectedIssueRequest] = useState<any | null>(null);
  const [selectedEditRequest, setSelectedEditRequest] = useState<any | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isCreateTransferOpen, setIsCreateTransferOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const costBreakdown = project.costBreakdown || {
    projectValue: project.projectValue || 0,
    estimatedMaterialCost: project.estimatedMaterialCost || 0,
    estimatedLabourCost: project.estimatedLabourCost || 0,
    estimatedTransportCost: project.estimatedTransportCost || 0,
    estimatedEquipmentCost: project.estimatedEquipmentCost || 0,
    estimatedOtherCost: project.estimatedOtherCost || 0,
    estimatedTotalCost: project.estimatedTotalCost || 0,
    actualMaterialCost: 0,
    actualLabourCost: 0,
    actualTransportCost: 0,
    actualEquipmentCost: 0,
    actualOtherCost: 0,
    actualTotalCost: 0,
    estimatedProfit: (project.projectValue || 0) - (project.estimatedTotalCost || 0),
    actualProfit: project.projectValue || 0,
    estimatedProfitMargin: project.projectValue ? (((project.projectValue || 0) - (project.estimatedTotalCost || 0)) / project.projectValue) * 100 : 0,
    actualProfitMargin: project.projectValue ? 100 : 0,
    costVariance: 0,
    budgetBalance: 0,
    profitOrLoss: 0,
    completionPercentage: 0,
  };

  const engineersList = users.filter(
    (u) => u.role === "ENGINEER" || u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );

  const leadEngineer = project.engineers?.find((e) => e.isLead)?.engineer;

  async function handleStartProject() {
    setActionLoading(true);
    setMessage(null);
    const res = await updateProjectStatusAction(project.id, "IN_PROGRESS");
    setActionLoading(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.message });
    }
  }

  async function handleCompleteProject() {
    setActionLoading(true);
    setMessage(null);
    const res = await completeProjectAction(project.id);
    setActionLoading(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.message });
    }
  }

  async function handleRemoveEngineer(engineerId: string) {
    if (!confirm("Are you sure you want to remove this engineer from the project?")) return;
    setActionLoading(true);
    const res = await removeEngineerAction(project.id, engineerId);
    setActionLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.message });
    }
  }

  async function handleSetLead(engineerId: string) {
    setActionLoading(true);
    const res = await setLeadEngineerAction(project.id, engineerId);
    setActionLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.message });
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-md">
                {project.projectCode}
              </span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {project.projectName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Customer: <strong className="text-gray-700 dark:text-gray-300">{project.customer?.companyName}</strong> | PM:{" "}
              <strong className="text-gray-700 dark:text-gray-300">{project.projectManager?.name}</strong> | Lead Engineer:{" "}
              <strong className="text-gray-700 dark:text-gray-300">{leadEngineer?.name || "Unassigned"}</strong>
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {project.status === "PENDING" && !isEngineerRole && (
              <button
                disabled={actionLoading}
                onClick={handleStartProject}
                className="px-4 py-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors"
              >
                🚀 Start Project
              </button>
            )}

            {project.status !== "COMPLETED" && project.status !== "CANCELLED" && (
              <>
                {can("material_request.create") && (
                  <button
                    onClick={() => setIsRequestOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    + Material Request
                  </button>
                )}

                {can("stock.transfer") && (
                  <button
                    onClick={() => setIsLogTransportOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    🚚 Log Transport
                  </button>
                )}

                {can("report.financial") && (
                  <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    💵 Log Expense
                  </button>
                )}

                {can("project_transfer.create") && !isEngineerRole && (
                  <button
                    onClick={() => setIsCreateTransferOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    🔄 Transfer Stock
                  </button>
                )}

                {can("project.complete") && (
                  <button
                    disabled={actionLoading}
                    onClick={handleCompleteProject}
                    className="px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    ✓ Complete Project
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm border ${message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
              }`}
          >
            {message.text}
          </div>
        )}

        {/* Financial Overview Metrics Bar */}
        {!isRestrictedRole && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Project Value</span>
            <span className="text-sm font-bold text-indigo-950 dark:text-indigo-100">
              {formatCurrency(costBreakdown.projectValue)}
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Est. Cost</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(costBreakdown.estimatedTotalCost)}
            </span>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Actual Cost
            </span>
            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(costBreakdown.actualTotalCost)}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Est. Profit (%)
            </span>
            <span
              className={`text-sm font-bold ${costBreakdown.estimatedProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"
                }`}
            >
              {formatCurrency(costBreakdown.estimatedProfit)} ({(costBreakdown.estimatedProfitMargin || 0).toFixed(1)}%)
            </span>
          </div>

          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Actual Profit (%)
            </span>
            <span
              className={`text-sm font-bold ${costBreakdown.actualProfit >= 0 ? "text-amber-800 dark:text-amber-200" : "text-red-600"
                }`}
            >
              {formatCurrency(costBreakdown.actualProfit)} ({(costBreakdown.actualProfitMargin || 0).toFixed(1)}%)
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Completion</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {costBreakdown.completionPercentage}%
              </span>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${costBreakdown.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* ERP Module Tabs */}
      {(() => {
        const allTabs: TabItem<TabType>[] = [
          { id: "overview", label: "Overview & Budget", icon: "📊", category: "general" },
          { id: "engineers", label: "Engineers", count: project.engineers?.length || 0, icon: "👥", category: "personnel" },
          { id: "tools", label: "Assigned Tools", count: (toolAssignments || []).flatMap((a: any) => a?.items || []).length, icon: "🔧", category: "personnel" },
          { id: "labour", label: "Labour", count: (projectLabours || []).length, icon: "👷", category: "personnel" },
          { id: "staff", label: "Staff", count: (project.projectManager ? 1 : 0) + (project.engineers?.length || 0), icon: "👥", category: "personnel" },
          { id: "requests", label: "Requests", count: project.materialRequests?.length || 0, icon: "📋", category: "materials" },
          { id: "issues", label: "Material Issues", count: project.projectMaterials?.length || 0, icon: "📦", category: "materials" },
          { id: "notes", label: "Delivery & Issue Notes", icon: "📜", category: "materials" },
          { id: "returns", label: "Returns", count: project.materialReturns?.length || 0, icon: "↩", category: "materials" },
          { id: "transport", label: "Transport", count: project.transports?.length || 0, icon: "🚚", category: "logistics" },
          { id: "transfers", label: "Stock Transfers", count: (projectTransfers || []).length, icon: "🔄", category: "logistics" },
          { id: "expenses", label: "Expense Ledger", count: project.expenses?.length || 0, icon: "💵", category: "finance" },
          { id: "timeline", label: "Timeline", count: timeline.length, icon: "⏱", category: "general" },
        ];
        const visibleTabs = allTabs.filter((tab) => {
          if (tab.id === "notes" && !can("stock.view_history")) return false;
          if (tab.id === "expenses" && !can("report.financial")) return false;
          // Engineer role: hide financial/overview/logistics tabs
          if (isEngineerRole && (tab.id === "overview" || tab.id === "notes" || tab.id === "timeline" || tab.id === "transport")) return false;
          // PM role: hide overview & budget and delivery & issue notes tabs
          if (isPMRole && (tab.id === "overview" || tab.id === "notes")) return false;
          return true;
        });

        return (
          <ScrollableTabs<TabType>
            tabs={visibleTabs}
            categories={[
              { id: "general", label: "Overview" },
              { id: "materials", label: "Materials" },
              { id: "personnel", label: "Personnel & Tools" },
              { id: "logistics", label: "Logistics" },
              { id: "finance", label: "Finance" },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId)}
          />
        );
      })()}

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: OVERVIEW & COST BREAKDOWN */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Information */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Project Specification</h3>
                <button
                  onClick={() => setIsUpdateCostsOpen(true)}
                  className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
                >
                  ⚙ Update Budget
                </button>
              </div>
              <div className="text-xs space-y-2.5 text-gray-600 dark:text-gray-300">
                <div>
                  <span className="text-gray-400">Location / Address:</span> {project.location || "Not specified"}
                </div>
                <div>
                  <span className="text-gray-400">Start Date:</span> {formatDate(project.startDate)}
                </div>
                <div>
                  <span className="text-gray-400">End Date:</span> {formatDate(project.endDate)}
                </div>
                <div>
                  <span className="text-gray-400">Scope of Work / Notes:</span>
                  <p className="mt-1 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-md text-gray-800 dark:text-gray-200">
                    {project.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Customer & Project Manager</h3>
              <div className="text-xs space-y-2.5 text-gray-600 dark:text-gray-300">
                <div>
                  <span className="text-gray-400">Company Name:</span> <strong>{project.customer?.companyName}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Contact Person:</span> {project.customer?.contactPerson || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Phone:</span> {project.customer?.phone || "N/A"} | Email: {project.customer?.email || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Project Manager:</span> {project.projectManager?.name} ({project.projectManager?.email})
                </div>
              </div>
            </div>
          </div>

          {/* ERP Estimated vs Actual Cost Breakdown Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Financial Breakdown: Estimated vs Actual Costs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Cost Category</th>
                    <th className="px-4 py-3 text-right">Estimated Cost</th>
                    <th className="px-4 py-3 text-right">Actual Cost</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">📦 Material Cost</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedMaterialCost)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{formatCurrency(costBreakdown.actualMaterialCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedMaterialCost - costBreakdown.actualMaterialCost)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">👷 Labour Cost</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedLabourCost)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{formatCurrency(costBreakdown.actualLabourCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedLabourCost - costBreakdown.actualLabourCost)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">👥 Project Staff Cost</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(0)}</td>
                    <td className="px-4 py-3 text-right text-purple-600 font-semibold">{formatCurrency(costBreakdown.actualStaffCost || 0)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(0 - (costBreakdown.actualStaffCost || 0))}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">🚚 Transport Cost</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedTransportCost)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{formatCurrency(costBreakdown.actualTransportCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedTransportCost - costBreakdown.actualTransportCost)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">🚜 Equipment Cost</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedEquipmentCost)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{formatCurrency(costBreakdown.actualEquipmentCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedEquipmentCost - costBreakdown.actualEquipmentCost)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">🏷 Other Expenses</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedOtherCost)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{formatCurrency(costBreakdown.actualOtherCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedOtherCost - costBreakdown.actualOtherCost)}</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800/70 font-bold text-gray-900 dark:text-gray-100 text-xs uppercase">
                    <td className="px-4 py-3">Total Estimated vs Actual Cost</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(costBreakdown.estimatedTotalCost)}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{formatCurrency(costBreakdown.actualTotalCost)}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(costBreakdown.costVariance)}</td>
                  </tr>
                  <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 font-extrabold text-indigo-950 dark:text-indigo-100 text-sm">
                    <td className="px-4 py-3.5">💰 Project Value (Contract Value / Customer Price)</td>
                    <td className="px-4 py-3.5 text-right" colSpan={3}>
                      {formatCurrency(costBreakdown.projectValue)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-100 text-xs">
                    <td className="px-4 py-3">📈 Estimated Profit & Margin %</td>
                    <td className="px-4 py-3 text-right" colSpan={3}>
                      {formatCurrency(costBreakdown.estimatedProfit)} ({(costBreakdown.estimatedProfitMargin || 0).toFixed(2)}%)
                    </td>
                  </tr>
                  <tr className="bg-amber-50/70 dark:bg-amber-950/40 font-bold text-amber-900 dark:text-amber-100 text-xs">
                    <td className="px-4 py-3">🏆 Actual Profit & Margin %</td>
                    <td className="px-4 py-3 text-right" colSpan={3}>
                      {formatCurrency(costBreakdown.actualProfit)} ({(costBreakdown.actualProfitMargin || 0).toFixed(2)}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ASSIGNED TOOLS */}
      {activeTab === "tools" && (
        <AssignedToolsTab
          projectId={project.id}
          projectName={`${project.projectCode} — ${project.projectName}`}
          engineers={(project.engineers || []).map((e) => ({
            id: e.engineerId,
            name: e.engineer?.name || "",
            email: e.engineer?.email || "",
          }))}
          toolAssignments={toolAssignments}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* TAB 2: MULTIPLE ENGINEERS */}
      {activeTab === "engineers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Assigned Site Engineers</h3>
              <p className="text-xs text-gray-500">Multiple engineers can be assigned. One engineer can be marked as Lead.</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setIsAssignEngineerOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
              >
                + Assign Engineer
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Engineer Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Lead Designation</th>
                  <th className="px-4 py-3">Assigned Date</th>
                  {isSuperAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {!project.engineers || project.engineers.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} className="text-center py-6 text-gray-500">
                      No engineers assigned yet. At least one engineer must be assigned before starting the project.
                    </td>
                  </tr>
                ) : (
                  project.engineers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                        {item.engineer?.name}
                        <div className="text-[11px] text-gray-400">{item.engineer?.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{item.engineer?.role}</td>
                      <td className="px-4 py-3.5">
                        {item.isLead ? (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full inline-flex items-center gap-1">
                            ⭐ Lead Engineer
                          </span>
                        ) : (
                          <span className="text-gray-400">Engineer</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{formatDate(item.assignedDate)}</td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3.5 text-right space-x-2">
                          {!item.isLead && (
                            <button
                              onClick={() => handleSetLead(item.engineerId)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md"
                            >
                              Set Lead
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveEngineer(item.engineerId)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-md"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MATERIAL REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Material Requests</h3>
            <button
              onClick={() => setIsRequestOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
            >
              + Submit Request
            </button>
          </div>

          {!project.materialRequests || project.materialRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl text-center text-gray-500 text-sm border border-gray-200 dark:border-gray-800">
              No material requests submitted for this project.
            </div>
          ) : (
            project.materialRequests.map((req) => (
              <div key={req.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                      {req.requestNo}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      Submitted: {formatDate(req.createdAt)} by {req.engineer?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ProjectStatusBadge status={req.status} />

                    {/* GM Review Step */}
                    {(req.status === "PENDING" || req.status === "PENDING_GM") &&
                      (currentUserRole === "GENERAL_MANAGER" || userRole === "GENERAL_MANAGER" || isSuperAdmin) && (
                        <button
                          onClick={() => setSelectedApproveRequest(req)}
                          className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 rounded-md"
                        >
                          GM Review
                        </button>
                      )}

                    {/* Admin Review Step */}
                    {req.status === "PENDING_ADMIN" &&
                      (currentUserRole === "ADMIN" || userRole === "ADMIN" || isSuperAdmin) && (
                        <button
                          onClick={() => setSelectedApproveRequest(req)}
                          className="px-3 py-1 text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 rounded-md"
                        >
                          Admin Review
                        </button>
                      )}

                    {/* Super Admin FIFO Issue */}
                    {(req.status === "APPROVED" || req.status === "PARTIAL") && isSuperAdmin && (
                      <button
                        onClick={() => setSelectedIssueRequest(req)}
                        className="px-3 py-1 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-md"
                      >
                        Issue FIFO
                      </button>
                    )}

                    {/* Engineer Edit & Resubmit */}
                    {req.status === "REJECTED" && (isEngineerRole || isSuperAdmin) && (
                      <button
                        onClick={() => setSelectedEditRequest(req)}
                        className="px-3 py-1 text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-md"
                      >
                        ✏ Edit & Resubmit
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2">Material Name</th>
                        <th className="px-3 py-2">Qty Requested</th>
                        <th className="px-3 py-2">Qty Approved</th>
                        <th className="px-3 py-2">Qty Issued</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {req.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-mono text-[11px] font-bold">{item.inventory.itemCode}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{item.inventory.name}</td>
                          <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">{item.qtyRequested} {item.inventory.unit}</td>
                          <td className="px-3 py-2 text-indigo-600 font-semibold">{item.qtyApproved} {item.inventory.unit}</td>
                          <td className="px-3 py-2 text-teal-600 font-semibold">{item.qtyIssued} {item.inventory.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: MATERIAL ISSUES (FIFO & ASSIGNED MATERIALS) */}
      {activeTab === "issues" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Assigned Project Materials (FIFO Issued)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">FIFO Batch</th>
                  <th className="px-4 py-3">Batch Unit Cost</th>
                  <th className="px-4 py-3">Issued Qty</th>
                  <th className="px-4 py-3">Returned Qty</th>
                  <th className="px-4 py-3">Balance Qty</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {!project.projectMaterials || project.projectMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500">
                      No materials issued to project site yet.
                    </td>
                  </tr>
                ) : (
                  project.projectMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{mat.inventory.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{mat.inventory.itemCode}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                        {mat.materialIssueItem?.stockBatch?.batchNo || `Batch #${mat.materialIssueItem?.stockBatch?.id || mat.id}`}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(mat.materialIssueItem?.stockBatch?.unitCost || 0)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{mat.issuedQty} {mat.inventory.unit}</td>
                      <td className="px-4 py-3 text-orange-600">{mat.returnedQty} {mat.inventory.unit}</td>
                      <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400">{mat.balanceQty} {mat.inventory.unit}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{mat.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TRANSPORTATION MODULE */}
      {activeTab === "transport" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Project Transportation Log</h3>
              <p className="text-xs text-gray-500">Vehicle dispatch, driver, & fuel costs automatically log to project expenses.</p>
            </div>
            <button
              onClick={() => setIsLogTransportOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            >
              + Log Transport
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Transport No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Vehicle #</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Route (From → To)</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {!project.transports || project.transports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      No transport entries logged for this project yet.
                    </td>
                  </tr>
                ) : (
                  project.transports.map((trn) => (
                    <tr key={trn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">{trn.transportNo}</td>
                      <td className="px-4 py-3">{formatDate(trn.transportDate)}</td>
                      <td className="px-4 py-3 font-semibold">{trn.vehicleNumber}</td>
                      <td className="px-4 py-3">{trn.driverName}</td>
                      <td className="px-4 py-3">{trn.fromLocation} → {trn.toLocation}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(trn.totalCost)}</td>
                      <td className="px-4 py-3 text-gray-500">{trn.createdByUser?.name || "User"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CENTRAL EXPENSE LEDGER */}
      {activeTab === "expenses" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Centralized Project Expense Ledger</h3>
              <p className="text-xs text-gray-500">All Material, Transport, Labour, Equipment & Other expenses.</p>
            </div>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
            >
              + Log Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Expense No</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Ref No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {!project.expenses || project.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      No project expenses recorded yet. Actual project cost is currently {formatCurrency(0)}.
                    </td>
                  </tr>
                ) : (
                  project.expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">{exp.expenseNo}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${exp.expenseType === "MATERIAL"
                            ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                            : exp.expenseType === "TRANSPORT"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : exp.expenseType === "LABOUR"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : exp.expenseType === "EQUIPMENT"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                        >
                          {exp.expenseType}
                        </span>
                      </td>
                      <td className="px-4 py-3">{exp.description || "N/A"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{exp.referenceNo || "—"}</td>
                      <td className="px-4 py-3">{formatDate(exp.expenseDate)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 py-3 text-gray-500">{exp.createdByUser?.name || "User"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: MATERIAL RETURNS */}
      {activeTab === "returns" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Material Returns</h3>
            <button
              onClick={() => setIsReturnOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm"
            >
              ↩ Return Materials
            </button>
          </div>

          {!project.materialReturns || project.materialReturns.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl text-center text-gray-500 text-sm border border-gray-200 dark:border-gray-800">
              No material returns recorded.
            </div>
          ) : (
            project.materialReturns.map((ret) => (
              <div key={ret.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                <div className="flex justify-between items-center flex-wrap">
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                      {ret.returnNo}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      Returned: {formatDateTime(ret.returnedDate)} by {ret.engineer?.name}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Material</th>
                        <th className="px-3 py-2">Qty Returned</th>
                        <th className="px-3 py-2">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {ret.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{item.inventory.name} ({item.inventory.itemCode})</td>
                          <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">{item.qtyReturned} {item.inventory.unit}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${item.condition === "GOOD"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {item.condition}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: PROJECT STOCK TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Project Stock Transfers (Sent & Received)
              </h3>
              <p className="text-xs text-gray-500">
                Direct stock movements between this project and other projects.
              </p>
            </div>
            <button
              onClick={() => setIsCreateTransferOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
            >
              + Transfer to Project
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Transfer No</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Other Project</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!projectTransfers || projectTransfers.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500">
                      No stock transfers logged for this project yet.
                    </td>
                  </tr>
                ) : (
                  projectTransfers.map((trf: any) => {
                    const isOutgoing = trf.fromProjectId === project.id;
                    const otherProject = isOutgoing ? trf.toProject : trf.fromProject;

                    return (
                      <tr key={trf.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">
                          {trf.transferNo}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${isOutgoing
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                          >
                            {isOutgoing ? "OUTGOING (SENT)" : "INCOMING (RECEIVED)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {otherProject?.projectCode} — {otherProject?.projectName}
                        </td>
                        <td className="px-4 py-3">{formatDate(trf.transferDate)}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                          {(trf.items || []).length} Item(s)
                        </td>
                        <td className="px-4 py-3 text-gray-500">{trf.requestedBy?.name || "System"}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{trf.status}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedTransfer(trf)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-md"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-4">Project Activity Timeline</h3>
          <ProjectTimeline events={timeline} />
        </div>
      )}

      {/* TAB 9: LABOUR */}
      {activeTab === "labour" && (
        <ProjectLabourTab
          projectId={project.id}
          projectLabours={projectLabours || []}
          availableLabours={availableLabours || []}
          projectStatus={project.status}
          currentUserRole={currentUserRole}
        />
      )}

      {/* TAB 10: STAFF */}
      {activeTab === "staff" && (
        <ProjectStaffTab
          projectId={project.id}
          projectStaff={projectStaff}
          users={users}
          projectStatus={project.status}
          currentUserRole={currentUserRole}
        />
      )}

      {/* TAB 11: DELIVERY & ISSUE NOTES */}
      {activeTab === "notes" && (
        <ProjectDeliveryAndIssueNotesTab
          project={project as any}
          toolAssignments={toolAssignments}
        />
      )}

      {/* MODALS */}
      {isRequestOpen && (
        <MaterialRequestModal
          isOpen={isRequestOpen}
          onClose={() => {
            setIsRequestOpen(false);
            router.refresh();
          }}
          projectId={project.id}
          engineerId={project.engineers?.[0]?.engineerId || project.projectManagerId}
          inventoryItems={inventoryItems}
        />
      )}

      {selectedApproveRequest && (
        <ApproveRequestModal
          isOpen={Boolean(selectedApproveRequest)}
          onClose={() => {
            setSelectedApproveRequest(null);
            router.refresh();
          }}
          requestId={selectedApproveRequest.id}
          requestNo={selectedApproveRequest.requestNo}
          items={selectedApproveRequest.items}
        />
      )}

      {selectedEditRequest && (
        <EditMaterialRequestModal
          isOpen={Boolean(selectedEditRequest)}
          onClose={() => {
            setSelectedEditRequest(null);
            router.refresh();
          }}
          requestId={selectedEditRequest.id}
          requestNo={selectedEditRequest.requestNo}
          initialRemarks={selectedEditRequest.remarks}
          initialItems={selectedEditRequest.items}
          inventoryItems={inventoryItems}
        />
      )}

      {selectedIssueRequest && (
        <IssueMaterialModal
          isOpen={Boolean(selectedIssueRequest)}
          onClose={() => {
            setSelectedIssueRequest(null);
            router.refresh();
          }}
          requestId={selectedIssueRequest.id}
          requestNo={selectedIssueRequest.requestNo}
          items={selectedIssueRequest.items.map((i: any) => ({
            inventoryName: i.inventory.name,
            qtyApproved: i.qtyApproved,
            qtyIssued: i.qtyIssued,
            unit: i.inventory.unit,
          }))}
        />
      )}

      {isReturnOpen && (
        <ReturnMaterialModal
          isOpen={isReturnOpen}
          onClose={() => {
            setIsReturnOpen(false);
            router.refresh();
          }}
          projectId={project.id}
          engineerId={project.engineers?.[0]?.engineerId || project.projectManagerId}
          assignedMaterials={
            project.projectMaterials
              ?.filter((m) => m.balanceQty > 0)
              .map((m) => ({
                id: m.id,
                inventoryId: m.inventory.id,
                issuedQty: m.issuedQty,
                returnedQty: m.returnedQty,
                balanceQty: m.balanceQty,
                inventory: m.inventory,
              })) || []
          }
        />
      )}

      {isAssignEngineerOpen && (
        <AssignEngineerModal
          isOpen={isAssignEngineerOpen}
          onClose={() => {
            setIsAssignEngineerOpen(false);
            router.refresh();
          }}
          projectId={project.id}
          engineers={engineersList}
        />
      )}

      {isLogTransportOpen && (
        <LogTransportModal
          isOpen={isLogTransportOpen}
          onClose={() => {
            setIsLogTransportOpen(false);
            router.refresh();
          }}
          projectId={project.id}
          projectCode={project.projectCode}
        />
      )}

      {isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false);
            router.refresh();
          }}
          projectId={project.id}
          projectCode={project.projectCode}
        />
      )}

      {isUpdateCostsOpen && (
        <UpdateProjectCostsModal
          isOpen={isUpdateCostsOpen}
          onClose={() => {
            setIsUpdateCostsOpen(false);
            router.refresh();
          }}
          projectId={project.id}
          projectCode={project.projectCode}
          initialEstimates={{
            projectValue: project.projectValue || 0,
            estimatedMaterialCost: project.estimatedMaterialCost || 0,
            estimatedLabourCost: project.estimatedLabourCost || 0,
            estimatedTransportCost: project.estimatedTransportCost || 0,
            estimatedEquipmentCost: project.estimatedEquipmentCost || 0,
            estimatedOtherCost: project.estimatedOtherCost || 0,
          }}
        />
      )}

      {isCreateTransferOpen && (
        <CreateTransferModal
          isOpen={isCreateTransferOpen}
          onClose={() => {
            setIsCreateTransferOpen(false);
            router.refresh();
          }}
          onSuccess={() => {
            router.refresh();
          }}
          projects={allProjects.length > 0 ? allProjects : [{ id: project.id, projectCode: project.projectCode, projectName: project.projectName }]}
          defaultFromProjectId={project.id}
        />
      )}

      {selectedTransfer && (
        <TransferDetailModal
          transfer={selectedTransfer}
          isOpen={!!selectedTransfer}
          onClose={() => {
            setSelectedTransfer(null);
            router.refresh();
          }}
          onRefresh={() => {
            router.refresh();
          }}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
}

export default ProjectDetailsClient;
