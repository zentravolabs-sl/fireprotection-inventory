"use client";

// ============================================================
// src/components/labour/ProjectLabourTab.tsx
// Redesigned Labour Management Tab with 2 Inner Sub-Tabs:
// 1. 📊 Released Labour Summary (Only RELEASED workers shown ONCE,
//    with cumulative days worked and Admin final cost & OT entry)
// 2. 📜 Active & Assignment Logs (Active workers on site, assign/release actions)
// ============================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  HardHat,
  Clock,
  DollarSign,
  UserX,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  CheckCircle,
  ShieldCheck,
  Users,
  FileText,
  AlertCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { AssignLabourModal } from "./AssignLabourModal";
import { LogOTModal } from "./LogOTModal";
import { SetLabourCostModal } from "./SetLabourCostModal";
import {
  assignLabourAction,
  updateLabourAssignmentAction,
  releaseLabourAction,
  logOTAction,
  deleteOTAction,
} from "@/app/actions/labour";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LabourOTRow {
  id: number;
  otDate: Date;
  otHours: number;
  otRatePerHour: number;
  otAmount: number;
  remarks: string | null;
  createdByUser: { name: string };
}

interface ProjectLabourRow {
  id: number;
  labourId: number;
  labourCost: number;
  startDate: Date | null;
  endDate: Date | null;
  releaseStatus: "ACTIVE" | "RELEASED" | "ON_LEAVE";
  releasedAt: Date | null;
  remarks: string | null;
  labour: {
    id: number;
    labourCode: string;
    name: string;
    labourType: { name: string };
    monthlySalary: number;
  };
  assignedByUser: { name: string };
  overtimes: LabourOTRow[];
}

interface AvailableLabour {
  id: number;
  labourCode: string;
  name: string;
  labourType: { name: string };
  monthlySalary: number;
}

interface Props {
  projectId: number;
  projectLabours: ProjectLabourRow[];
  availableLabours: AvailableLabour[];
  projectStatus: string;
  currentUserRole?: string;
}

interface GroupedLabourWorker {
  labourId: number;
  labour: {
    id: number;
    labourCode: string;
    name: string;
    labourType: { name: string };
    monthlySalary: number;
  };
  assignments: ProjectLabourRow[];
  totalWorkingDays: number;
  totalLabourCost: number;
  totalOTCost: number;
  grandTotalCost: number;
  isCurrentlyActive: boolean;
  activeAssignment?: ProjectLabourRow;
  latestAssignment: ProjectLabourRow;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LKR = (n: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(n);

const fmtDate = (d: Date | null | string) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

function getWorkingDays(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  releasedAt?: Date | string | null,
  releaseStatus?: string
) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  if (isNaN(start.getTime())) return 0;

  let end: Date;
  if (releaseStatus === "RELEASED" && releasedAt) {
    end = new Date(releasedAt);
  } else if (endDate) {
    end = new Date(endDate);
  } else {
    end = new Date();
  }
  end.setHours(0, 0, 0, 0);
  if (isNaN(end.getTime())) return 0;

  const diffMs = end.getTime() - start.getTime();
  const days = Math.max(1, Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60 * 24)) + 1);
  return days;
}

function StatusBadge({ status }: { status: "ACTIVE" | "RELEASED" | "ON_LEAVE" }) {
  const map = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
    RELEASED: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700",
    ON_LEAVE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
  };
  const labels = { ACTIVE: "Active", RELEASED: "Released", ON_LEAVE: "On Leave" };
  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ProjectLabourTab({
  projectId,
  projectLabours,
  availableLabours,
  projectStatus,
  currentUserRole = "USER",
}: Props) {
  const router = useRouter();

  // Sub-Tab state: "summary" (Released Labour Summary) vs "logs" (Active & Assignment Logs)
  const [innerTab, setInnerTab] = useState<"summary" | "logs">("summary");

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isOTOpen, setIsOTOpen] = useState(false);
  const [preselectedOTId, setPreselectedOTId] = useState<number | undefined>(undefined);
  const [costTarget, setCostTarget] = useState<ProjectLabourRow | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<ProjectLabourRow | null>(null);
  const [deleteOTTarget, setDeleteOTTarget] = useState<{ id: number; projectLabourId: number } | null>(null);
  const [expandedWorkerIds, setExpandedWorkerIds] = useState<Set<number>>(new Set());

  const [assignLoading, setAssignLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [otLoading, setOTLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [deleteOTLoading, setDeleteOTLoading] = useState(false);

  const isClosed = projectStatus === "COMPLETED" || projectStatus === "CANCELLED";

  // Permissions check
  const isAdminOrPM = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN" || currentUserRole === "PROJECT_MANAGER";

  // ── Grouping by Unique Worker (NO DUPLICATES) ────────────────────────────
  const groupedWorkersMap = new Map<number, GroupedLabourWorker>();

  for (const pl of projectLabours) {
    const days = getWorkingDays(pl.startDate, pl.endDate, pl.releasedAt, pl.releaseStatus);
    const otTotal = pl.overtimes.reduce((s, o) => s + o.otAmount, 0);

    if (!groupedWorkersMap.has(pl.labourId)) {
      groupedWorkersMap.set(pl.labourId, {
        labourId: pl.labourId,
        labour: pl.labour,
        assignments: [pl],
        totalWorkingDays: days,
        totalLabourCost: pl.labourCost,
        totalOTCost: otTotal,
        grandTotalCost: pl.labourCost + otTotal,
        isCurrentlyActive: pl.releaseStatus === "ACTIVE",
        activeAssignment: pl.releaseStatus === "ACTIVE" ? pl : undefined,
        latestAssignment: pl,
      });
    } else {
      const existing = groupedWorkersMap.get(pl.labourId)!;
      existing.assignments.push(pl);
      existing.totalWorkingDays += days;
      existing.totalLabourCost += pl.labourCost;
      existing.totalOTCost += otTotal;
      existing.grandTotalCost += pl.labourCost + otTotal;
      if (pl.releaseStatus === "ACTIVE") {
        existing.isCurrentlyActive = true;
        existing.activeAssignment = pl;
      }
      existing.latestAssignment = pl;
    }
  }

  const allGroupedWorkers = Array.from(groupedWorkersMap.values());

  // Filter 1: ONLY RELEASED WORKERS for the Labour Summary sub-tab (user requirement!)
  const releasedSummaryWorkers = allGroupedWorkers.filter((w) => !w.isCurrentlyActive);

  // Active assignments currently on site
  const activeAssignments = projectLabours.filter((pl) => pl.releaseStatus === "ACTIVE");
  const releasedAssignments = projectLabours.filter((pl) => pl.releaseStatus === "RELEASED");

  // Overall totals across the project
  const projectTotalLabourCost = allGroupedWorkers.reduce((s, w) => s + w.totalLabourCost, 0);
  const projectTotalOTCost = allGroupedWorkers.reduce((s, w) => s + w.totalOTCost, 0);
  const projectGrandTotalCost = projectTotalLabourCost + projectTotalOTCost;
  const projectTotalDays = allGroupedWorkers.reduce((s, w) => s + w.totalWorkingDays, 0);

  const toggleWorkerExpand = (labourId: number) => {
    setExpandedWorkerIds((prev) => {
      const next = new Set(prev);
      next.has(labourId) ? next.delete(labourId) : next.add(labourId);
      return next;
    });
  };

  // Handlers
  const handleAssign = async (data: {
    labourId: number;
    labourCost: number;
    startDate: string | null;
    endDate: string | null;
    remarks: string | null;
  }) => {
    setAssignLoading(true);
    const res = await assignLabourAction({ projectId, ...data });
    setAssignLoading(false);
    if (res.success) {
      toast.success(res.message);
      setIsAssignOpen(false);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleSetCost = async (data: { id: number; labourCost: number; remarks?: string | null }) => {
    setCostLoading(true);
    const res = await updateLabourAssignmentAction({ id: data.id, labourCost: data.labourCost, remarks: data.remarks }, projectId);
    setCostLoading(false);
    if (res.success) {
      toast.success("Labour cost updated successfully.");
      setCostTarget(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleRelease = async () => {
    if (!releaseTarget) return;
    setReleaseLoading(true);
    const res = await releaseLabourAction(releaseTarget.id, projectId);
    setReleaseLoading(false);
    if (res.success) {
      toast.success(res.message);
      setReleaseTarget(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleLogOT = async (data: {
    projectLabourId: number;
    otDate: string;
    otHours: number;
    otRatePerHour: number;
    remarks: string | null;
  }) => {
    setOTLoading(true);
    const res = await logOTAction(data, projectId);
    setOTLoading(false);
    if (res.success) {
      toast.success(res.message);
      setIsOTOpen(false);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteOT = async () => {
    if (!deleteOTTarget) return;
    setDeleteOTLoading(true);
    const res = await deleteOTAction(deleteOTTarget.id, projectId);
    setDeleteOTLoading(false);
    if (res.success) {
      toast.success(res.message);
      setDeleteOTTarget(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Total Workforce</span>
          <span className="text-xl font-black text-gray-900 dark:text-gray-100">{allGroupedWorkers.length} Worker{allGroupedWorkers.length !== 1 ? "s" : ""}</span>
          <span className="text-xs text-gray-400 block mt-0.5">
            {activeAssignments.length} active · {releasedSummaryWorkers.length} released
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Labour Cost</span>
          <span className="text-lg font-black text-blue-700 dark:text-blue-400">{LKR(projectTotalLabourCost)}</span>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">OT Cost</span>
          <span className="text-lg font-black text-orange-600 dark:text-orange-400">{LKR(projectTotalOTCost)}</span>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm">
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block">Total Labour + OT</span>
          <span className="text-lg font-black text-red-700 dark:text-red-300">{LKR(projectGrandTotalCost)}</span>
        </div>
      </div>

      {/* ── Sub-Tab Navigation Bar & Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
        {/* Inner Sub-Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setInnerTab("summary")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${innerTab === "summary"
                ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Users size={14} />
            <span>Released Labour Summary ({releasedSummaryWorkers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setInnerTab("logs")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${innerTab === "logs"
                ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <FileText size={14} />
            <span>Active & Assignment Logs ({projectLabours.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        {!isClosed && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAssignOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Plus size={14} />
              Assign Worker
            </button>
          </div>
        )}
      </div>

      {/* ── SUB-TAB 1: RELEASED LABOUR SUMMARY (ONLY RELEASED WORKERS SHOWN ONCE WITH TOTAL DAYS & ADMIN COST/OT SETTING) ── */}
      {innerTab === "summary" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-3 text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>
                This summary shows <strong>only workers who have been released</strong> from the project. Super Admin / Admin can manually set their final Labour Cost and OT.
              </span>
            </div>
          </div>

          {releasedSummaryWorkers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Users size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">No released workers yet for cost finalization.</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Active workers currently on site appear in the <strong>Active & Assignment Logs</strong> tab. Release a worker when their project work is finished to set their final cost here.
              </p>
            </div>
          ) : (
            releasedSummaryWorkers.map((worker) => {
              const isExpanded = expandedWorkerIds.has(worker.labourId);
              const targetAssignment = worker.latestAssignment;

              return (
                <div
                  key={worker.labourId}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-700"
                >
                  {/* Single Unified Worker Card Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4">
                    {/* Left: Profile Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {worker.labour.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{worker.labour.name}</span>
                          <span className="font-mono text-xs text-red-600 dark:text-red-400 font-bold">{worker.labour.labourCode}</span>
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-semibold">
                            {worker.labour.labourType.name}
                          </span>
                          <StatusBadge status="RELEASED" />
                        </div>

                        {/* Cumulative Total Working Days Highlight */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800/80 shadow-xs">
                            <Clock size={13} className="text-blue-600 dark:text-blue-400" />
                            <span>Total Working Days: <strong className="text-blue-800 dark:text-blue-200">{worker.totalWorkingDays} Day{worker.totalWorkingDays !== 1 ? "s" : ""} Worked</strong></span>
                          </span>

                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {worker.assignments.length} assignment period{worker.assignments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Costs & Admin Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-0 border-gray-100 dark:border-gray-800">
                      {/* Financial Summary */}
                      <div className="text-left lg:text-right">
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Final Cost</div>
                        <div className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                          {LKR(worker.grandTotalCost)}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Labour: <strong className="text-blue-600 dark:text-blue-400">{LKR(worker.totalLabourCost)}</strong>
                          {worker.totalOTCost > 0 && (
                            <> · OT: <strong className="text-orange-600 dark:text-orange-400">{LKR(worker.totalOTCost)}</strong></>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Set Cost & Log OT */}
                      <div className="flex items-center gap-1.5">
                        {!isClosed && isAdminOrPM && (
                          <>
                            {/* Super Admin & Admin / PM: Set Labour Cost */}
                            <button
                              type="button"
                              onClick={() => setCostTarget(targetAssignment)}
                              title="Super Admin / Admin: Set Final Labour Cost"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                            >
                              <DollarSign size={13} />
                              <span>Set Cost</span>
                            </button>

                            {/* Log OT for Released Worker */}
                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedOTId(targetAssignment.id);
                                setIsOTOpen(true);
                              }}
                              title="Log Overtime for Released Worker"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm transition-colors"
                            >
                              <Clock size={13} />
                              <span>Log OT</span>
                            </button>
                          </>
                        )}

                        {/* Toggle Expand History */}
                        <button
                          type="button"
                          onClick={() => toggleWorkerExpand(worker.labourId)}
                          title={isExpanded ? "Collapse History" : "View History & OT"}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <History size={13} />
                          <span>{worker.assignments.length}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Assignment History & OT Records */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30 p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <History size={14} className="text-gray-400" />
                        <span>Assignment Spans & OT Breakdown ({worker.assignments.length} Period{worker.assignments.length !== 1 ? "s" : ""})</span>
                      </h4>

                      <div className="space-y-2">
                        {worker.assignments.map((assignment, idx) => {
                          const days = getWorkingDays(assignment.startDate, assignment.endDate, assignment.releasedAt, assignment.releaseStatus);
                          const otTotal = assignment.overtimes.reduce((s, o) => s + o.otAmount, 0);

                          return (
                            <div
                              key={assignment.id}
                              className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 space-y-2"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 flex-wrap font-medium">
                                  <span className="font-bold text-gray-700 dark:text-gray-300">Period #{idx + 1}:</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {fmtDate(assignment.startDate)} → {fmtDate(assignment.releasedAt)}
                                  </span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">({days} Days)</span>
                                  <StatusBadge status="RELEASED" />
                                </div>

                                <div className="flex items-center gap-3 font-semibold text-gray-800 dark:text-gray-200">
                                  <span>Labour: {LKR(assignment.labourCost)}</span>
                                  {otTotal > 0 && <span className="text-orange-600 dark:text-orange-400">OT: {LKR(otTotal)}</span>}
                                </div>
                              </div>

                              {/* OT Entries for this specific assignment period */}
                              {assignment.overtimes.length > 0 && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                                  <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                                    OT Entries ({assignment.overtimes.length}):
                                  </p>
                                  {assignment.overtimes.map((ot) => (
                                    <div
                                      key={ot.id}
                                      className="flex items-center justify-between text-[11px] px-2 py-1 bg-gray-50 dark:bg-gray-800/60 rounded-md"
                                    >
                                      <span>{fmtDate(ot.otDate)} · {ot.otHours}h × {LKR(ot.otRatePerHour)} = <strong>{LKR(ot.otAmount)}</strong> {ot.remarks ? `(${ot.remarks})` : ""}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400">by {ot.createdByUser.name}</span>
                                        {!isClosed && isAdminOrPM && (
                                          <button
                                            type="button"
                                            onClick={() => setDeleteOTTarget({ id: ot.id, projectLabourId: assignment.id })}
                                            className="text-gray-400 hover:text-red-500"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: ACTIVE WORKERS & ASSIGNMENT LOGS ── */}
      {innerTab === "logs" && (
        <div className="space-y-6">
          {/* Active Assignments currently on site */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Active Workers Currently On Site ({activeAssignments.length})
                </h3>
              </div>
              {!isClosed && (
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus size={12} />
                  Assign Worker
                </button>
              )}
            </div>

            {activeAssignments.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No active workers currently on site.</p>
            ) : (
              activeAssignments.map((pl) => {
                const daysWorked = getWorkingDays(pl.startDate, pl.endDate, pl.releasedAt, pl.releaseStatus);
                const plOTTotal = pl.overtimes.reduce((s, o) => s + o.otAmount, 0);

                return (
                  <div key={pl.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {pl.labour.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{pl.labour.name}</span>
                          <span className="font-mono text-[11px] text-red-600 dark:text-red-400">{pl.labour.labourCode}</span>
                          <span className="px-1.5 py-0.5 text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md font-medium">{pl.labour.labourType.name}</span>
                          <StatusBadge status={pl.releaseStatus} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>{fmtDate(pl.startDate)} → {pl.endDate ? fmtDate(pl.endDate) : "Present"}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">⏱ ({daysWorked} Days Worked)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <div className="text-right text-xs">
                        <span className="block font-bold text-gray-900 dark:text-gray-100">Labour: {LKR(pl.labourCost)}</span>
                        {plOTTotal > 0 && <span className="block font-bold text-orange-600">OT: {LKR(plOTTotal)}</span>}
                      </div>
                      {!isClosed && (
                        <button
                          type="button"
                          onClick={() => setReleaseTarget(pl)}
                          title="Release Worker from Project"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <UserX size={13} />
                          <span>Release</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Past Released History Records */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
              <History size={16} className="text-gray-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                All Raw Assignment History Logs ({releasedAssignments.length})
              </h3>
            </div>
            {releasedAssignments.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No past assignment history logs.</p>
            ) : (
              releasedAssignments.map((pl) => {
                const daysWorked = getWorkingDays(pl.startDate, pl.endDate, pl.releasedAt, pl.releaseStatus);
                const plOTTotal = pl.overtimes.reduce((s, o) => s + o.otAmount, 0);

                return (
                  <div key={pl.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-4 shadow-sm opacity-80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center font-bold text-xs">
                        {pl.labour.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{pl.labour.name}</span>
                          <span className="font-mono text-[11px] text-red-600 dark:text-red-400">{pl.labour.labourCode}</span>
                          <span className="px-1.5 py-0.5 text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md font-medium">{pl.labour.labourType.name}</span>
                          <StatusBadge status={pl.releaseStatus} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>{fmtDate(pl.startDate)} → {fmtDate(pl.releasedAt)}</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">({daysWorked} Days)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="block font-bold text-gray-900 dark:text-gray-100">Labour: {LKR(pl.labourCost)}</span>
                      {plOTTotal > 0 && <span className="block font-bold text-orange-600">OT: {LKR(plOTTotal)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Assign Worker Modal (Site Engineer) ── */}
      <AssignLabourModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSubmit={handleAssign}
        availableLabours={availableLabours}
        isSubmitting={assignLoading}
      />

      {/* ── Set Labour Cost Modal (Super Admin & Admin / PM) ── */}
      <SetLabourCostModal
        isOpen={Boolean(costTarget)}
        onClose={() => setCostTarget(null)}
        onSubmit={handleSetCost}
        assignment={costTarget}
        isSubmitting={costLoading}
      />

      {/* ── Log OT Modal ── */}
      <LogOTModal
        isOpen={isOTOpen}
        onClose={() => setIsOTOpen(false)}
        onSubmit={handleLogOT}
        assignments={projectLabours}
        isSubmitting={otLoading}
        preselectedId={preselectedOTId}
      />

      {/* ── Release Confirm ── */}
      <ConfirmDialog
        isOpen={Boolean(releaseTarget)}
        onClose={() => setReleaseTarget(null)}
        onConfirm={handleRelease}
        title="Release Worker from Project"
        description={`Release "${releaseTarget?.labour.name}" from this project? They will be available for new assignments, and will move to the Released Labour Summary tab for cost finalization.`}
        confirmText="Release"
        variant="warning"
        isLoading={releaseLoading}
      />

      {/* ── Delete OT Confirm ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteOTTarget)}
        onClose={() => setDeleteOTTarget(null)}
        onConfirm={handleDeleteOT}
        title="Delete OT Record"
        description="Are you sure you want to delete this OT record?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteOTLoading}
      />
    </div>
  );
}
