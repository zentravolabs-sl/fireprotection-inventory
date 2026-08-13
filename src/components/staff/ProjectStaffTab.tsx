"use client";

// ============================================================
// src/components/staff/ProjectStaffTab.tsx
// Unified Project Staff Management Module UI Tab.
// Displays assigned Project Manager & Engineers with:
// - Salary Cost & Overtime (OT) Cost management (like Labour tab)
// - Automatic contribution to project actual total cost
// - Financial breakdown (PM vs Engineers)
// - Interactive Edit Cost modal for Admin / PM
// ============================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Users,
  Clock,
  DollarSign,
  UserX,
  ShieldCheck,
  Briefcase,
  PieChart,
  Star,
  Eye,
  Crown,
  Wrench,
  FileText,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SetStaffCostModal } from "./SetStaffCostModal";
import { ReleaseStaffModal } from "./ReleaseStaffModal";
import {
  updateProjectStaffAction,
  releaseProjectStaffAction,
  setLeadEngineerStaffAction,
} from "@/app/actions/staff";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectStaffRow {
  id: number;
  projectId: number;
  userId: string;
  role: "PROJECT_MANAGER" | "ENGINEER";
  isLead?: boolean;
  assignedDate: Date | string;
  releasedDate: Date | string | null;
  status: "ACTIVE" | "RELEASED";
  salaryCost: number;
  otHours: number;
  otCost: number;
  remarks: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Props {
  projectId: number;
  projectStaff: ProjectStaffRow[];
  users: UserOption[];
  projectStatus: string;
  currentUserRole?: string;
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

function StatusBadge({ status }: { status: "ACTIVE" | "RELEASED" }) {
  const map = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
    RELEASED: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${map[status]}`}>
      {status === "ACTIVE" ? "Active" : "Released"}
    </span>
  );
}

function RoleBadge({ role }: { role: "PROJECT_MANAGER" | "ENGINEER" }) {
  const isPM = role === "PROJECT_MANAGER";
  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-bold rounded-md border inline-flex items-center gap-1 ${isPM
          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60"
          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60"
        }`}
    >
      {isPM ? <Crown size={11} /> : <Wrench size={11} />}
      {isPM ? "Project Manager" : "Engineer"}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Staff Details Modal ───────────────────────────────────────────────────────

function StaffDetailsModal({
  isOpen,
  onClose,
  staff,
  canEditCost,
  isAdminOrPM,
  isClosed,
  onOpenCost,
  onSetLead,
  onRelease,
}: {
  isOpen: boolean;
  onClose: () => void;
  staff: ProjectStaffRow | null;
  canEditCost: boolean;
  isAdminOrPM: boolean;
  isClosed: boolean;
  onOpenCost: (s: ProjectStaffRow) => void;
  onSetLead: (s: ProjectStaffRow) => void;
  onRelease: (s: ProjectStaffRow) => void;
}) {
  if (!staff) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Staff Details — ${staff.user.name}`} maxWidth="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar name={staff.user.name} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{staff.user.name}</h3>
                <RoleBadge role={staff.role} />
                <StatusBadge status={staff.status} />
                {staff.role === "ENGINEER" && staff.isLead && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md border border-amber-200 inline-flex items-center gap-1">
                    ⭐ Lead Engineer
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{staff.user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 space-y-1">
            <span className="text-gray-400 block uppercase font-medium text-[10px]">Assigned Date</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{fmtDate(staff.assignedDate)}</span>
          </div>

          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 space-y-1">
            <span className="text-gray-400 block uppercase font-medium text-[10px]">Released Date</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{fmtDate(staff.releasedDate)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-500" />
            <span>Overtime Summary</span>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-500 uppercase font-semibold block">OT Hours</span>
              <span className="text-base font-black text-gray-900 dark:text-gray-100">{staff.otHours} h</span>
            </div>
            <div className="p-3 bg-orange-50/60 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-900/50">
              <span className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-semibold block">OT Cost</span>
              <span className="text-base font-black text-orange-900 dark:text-orange-100">{LKR(staff.otCost)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <DollarSign size={14} className="text-purple-500" />
            <span>Project Staff Cost</span>
          </h4>
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Allocated Project Salary Cost:</span>
              <strong className="text-blue-600 dark:text-blue-400 font-bold">{LKR(staff.salaryCost)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Overtime Cost:</span>
              <strong className="text-orange-600 dark:text-orange-400 font-bold">{LKR(staff.otCost)}</strong>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-purple-200/60 dark:border-purple-800/60 text-sm">
              <span className="font-extrabold text-purple-900 dark:text-purple-300">Total Staff Cost (Salary + OT):</span>
              <span className="font-black text-purple-700 dark:text-purple-300">{LKR(staff.salaryCost + staff.otCost)}</span>
            </div>
          </div>
        </div>

        {staff.remarks && (
          <div className="text-xs text-gray-500 italic p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            Remarks: {staff.remarks}
          </div>
        )}

        {!isClosed && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 flex-wrap">
            {canEditCost && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCost(staff);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <DollarSign size={14} />
                Edit Cost & OT
              </button>
            )}

            {isAdminOrPM && staff.role === "ENGINEER" && staff.status === "ACTIVE" && !staff.isLead && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSetLead(staff);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-sm"
              >
                <Star size={14} />
                Set Lead Engineer
              </button>
            )}

            {isAdminOrPM && staff.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRelease(staff);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                <UserX size={14} />
                Release Staff
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ProjectStaffTab({
  projectId,
  projectStaff,
  users,
  projectStatus,
  currentUserRole = "USER",
}: Props) {
  const router = useRouter();

  const [subTab, setSubTab] = useState<"staff" | "summary">("staff");

  const [detailsTarget, setDetailsTarget] = useState<ProjectStaffRow | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<ProjectStaffRow | null>(null);
  const [costTarget, setCostTarget] = useState<ProjectStaffRow | null>(null);

  const [releaseLoading, setReleaseLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [setLeadLoading, setSetLeadLoading] = useState(false);

  const isClosed = projectStatus === "COMPLETED" || projectStatus === "CANCELLED";

  const isAdminOrPM =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN" || currentUserRole === "PROJECT_MANAGER";
  const canEditCost = isAdminOrPM;
  // Hide financial columns from Engineers and Project Managers
  const hideFinancials = currentUserRole === "ENGINEER" || currentUserRole === "PROJECT_MANAGER";

  // Deduplicate staff by unique (userId, role) to prevent UI duplicate rows
  const cleanProjectStaff = React.useMemo(() => {
    const map = new Map<string, ProjectStaffRow>();
    for (const s of projectStaff) {
      const key = `${s.userId}_${s.role}`;
      if (!map.has(key)) {
        map.set(key, s);
      }
    }
    return Array.from(map.values());
  }, [projectStaff]);

  const activeStaff = cleanProjectStaff.filter((s) => s.status === "ACTIVE");
  const releasedStaff = cleanProjectStaff.filter((s) => s.status === "RELEASED");

  const totalSalaryCost = cleanProjectStaff.reduce((sum, s) => sum + s.salaryCost, 0);
  const totalOTCost = cleanProjectStaff.reduce((sum, s) => sum + s.otCost, 0);
  const totalStaffCost = totalSalaryCost + totalOTCost;
  const totalOTHours = cleanProjectStaff.reduce((sum, s) => sum + s.otHours, 0);

  const pmStaff = cleanProjectStaff.filter((s) => s.role === "PROJECT_MANAGER");
  const engStaff = cleanProjectStaff.filter((s) => s.role === "ENGINEER");

  const pmSalaryCost = pmStaff.reduce((s, x) => s + x.salaryCost, 0);
  const pmOTCost = pmStaff.reduce((s, x) => s + x.otCost, 0);
  const engSalaryCost = engStaff.reduce((s, x) => s + x.salaryCost, 0);
  const engOTCost = engStaff.reduce((s, x) => s + x.otCost, 0);

  const handleSetLead = async (s: ProjectStaffRow) => {
    setSetLeadLoading(true);
    const res = await setLeadEngineerStaffAction(s.id, projectId);
    setSetLeadLoading(false);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleSetCost = async (data: {
    id: number;
    salaryCost: number;
    otHours: number;
    otCost: number;
    remarks?: string | null;
  }) => {
    setCostLoading(true);
    const res = await updateProjectStaffAction(data, projectId);
    setCostLoading(false);
    if (res.success) {
      toast.success(res.message);
      setCostTarget(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleReleaseConfirm = async (releasedDate: string) => {
    if (!releaseTarget) return;
    setReleaseLoading(true);
    const res = await releaseProjectStaffAction(
      { projectStaffId: releaseTarget.id, releasedDate },
      projectId
    );
    setReleaseLoading(false);
    if (res.success) {
      toast.success(res.message);
      setReleaseTarget(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className={`grid gap-3 ${hideFinancials ? "grid-cols-2 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Active Staff</span>
          <span className="text-xl font-black text-gray-900 dark:text-gray-100">{activeStaff.length}</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Released Staff</span>
          <span className="text-xl font-black text-gray-500">{releasedStaff.length}</span>
        </div>

        {!hideFinancials && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Total OT Hours</span>
            <span className="text-xl font-black text-orange-600 dark:text-orange-400">{totalOTHours} h</span>
          </div>
        )}

        {!hideFinancials && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Salary Cost</span>
            <span className="text-lg font-black text-blue-700 dark:text-blue-400">{LKR(totalSalaryCost)}</span>
          </div>
        )}

        {!hideFinancials && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">OT Cost</span>
            <span className="text-lg font-black text-orange-600 dark:text-orange-400">{LKR(totalOTCost)}</span>
          </div>
        )}

        {!hideFinancials && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Total Staff Cost</span>
            <span className="text-lg font-black text-purple-700 dark:text-purple-300">{LKR(totalStaffCost)}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab("staff")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${subTab === "staff"
                ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Users size={14} />
            <span>Staff Members Table ({cleanProjectStaff.length})</span>
          </button>

          {!hideFinancials && (
            <button
              type="button"
              onClick={() => setSubTab("summary")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${subTab === "summary"
                  ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              <PieChart size={14} />
              <span>Cost Summary Breakdown</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: STAFF MEMBERS TABLE */}
      {subTab === "staff" && (
        <div className="space-y-6">
          {cleanProjectStaff.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Users size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">No project staff records found.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden space-y-4 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                <Users size={16} className="text-red-600" />
                <span>Project Staff Cost Ledger</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Lead Designation</th>
                      <th className="px-4 py-3">Assigned Date</th>
                      {!hideFinancials && <th className="px-4 py-3 text-right">Salary Cost</th>}
                      {!hideFinancials && <th className="px-4 py-3 text-right">OT Hours</th>}
                      {!hideFinancials && <th className="px-4 py-3 text-right">OT Cost</th>}
                      {!hideFinancials && <th className="px-4 py-3 text-right">Total Cost</th>}
                      <th className="px-4 py-3">Status</th>
                      {!hideFinancials && <th className="px-4 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {cleanProjectStaff.map((s) => {
                      const totalRowCost = s.salaryCost + s.otCost;
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${s.status === "RELEASED" ? "opacity-70 bg-gray-50/40 dark:bg-gray-900/40" : ""
                            }`}
                        >
                          <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.user.name} />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setDetailsTarget(s)}
                                  className="font-bold hover:text-red-600 text-left"
                                >
                                  {s.user.name}
                                </button>
                                <div className="text-[11px] text-gray-400">{s.user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <RoleBadge role={s.role} />
                          </td>

                          <td className="px-4 py-3.5">
                            {s.role === "ENGINEER" && s.isLead ? (
                              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full inline-flex items-center gap-1">
                                ⭐ Lead Engineer
                              </span>
                            ) : s.role === "ENGINEER" ? (
                              <span className="text-gray-400">Engineer</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-gray-500">{fmtDate(s.assignedDate)}</td>

                          {!hideFinancials && (
                            <td className="px-4 py-3.5 text-right font-medium text-blue-600 dark:text-blue-400">
                              {LKR(s.salaryCost)}
                            </td>
                          )}

                          {!hideFinancials && (
                            <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300 font-medium">
                              {s.otHours} h
                            </td>
                          )}

                          {!hideFinancials && (
                            <td className="px-4 py-3.5 text-right font-medium text-orange-600 dark:text-orange-400">
                              {LKR(s.otCost)}
                            </td>
                          )}

                          {!hideFinancials && (
                            <td className="px-4 py-3.5 text-right font-extrabold text-purple-700 dark:text-purple-300">
                              {LKR(totalRowCost)}
                            </td>
                          )}

                          <td className="px-4 py-3.5">
                            <StatusBadge status={s.status} />
                          </td>

                          {!hideFinancials && (
                            <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setDetailsTarget(s)}
                                title="View Staff Details"
                                className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 rounded-lg"
                              >
                                Details
                              </button>

                              {!isClosed && (
                                <>
                                  {canEditCost && (
                                    <button
                                      type="button"
                                      onClick={() => setCostTarget(s)}
                                      title="Edit Salary & OT Cost"
                                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                                    >
                                      Edit Cost
                                    </button>
                                  )}

                                  {isAdminOrPM && s.role === "ENGINEER" && s.status === "ACTIVE" && !s.isLead && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetLead(s)}
                                      disabled={setLeadLoading}
                                      title="Set Lead Engineer"
                                      className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 rounded-lg"
                                    >
                                      Set Lead
                                    </button>
                                  )}

                                  {isAdminOrPM && s.status === "ACTIVE" && (
                                    <button
                                      type="button"
                                      onClick={() => setReleaseTarget(s)}
                                      title="Release Staff Member"
                                      className="px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 rounded-lg"
                                    >
                                      Release
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: COST SUMMARY */}
      {subTab === "summary" && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <PieChart size={16} className="text-purple-600" />
              <span>Project Staff Cost Summary Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-2">
                <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
                  <span className="font-bold text-sm text-purple-900 dark:text-purple-300">Project Manager Costs ({pmStaff.length})</span>
                  <span className="font-black text-sm text-purple-700 dark:text-purple-400">{LKR(pmSalaryCost + pmOTCost)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Salary Cost:</span>
                  <strong className="text-gray-900 dark:text-gray-100">{LKR(pmSalaryCost)}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Overtime Cost:</span>
                  <strong className="text-orange-600">{LKR(pmOTCost)}</strong>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/60 pb-2">
                  <span className="font-bold text-sm text-blue-900 dark:text-blue-300">Engineer Costs ({engStaff.length})</span>
                  <span className="font-black text-sm text-blue-700 dark:text-blue-400">{LKR(engSalaryCost + engOTCost)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Salary Cost:</span>
                  <strong className="text-gray-900 dark:text-gray-100">{LKR(engSalaryCost)}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Overtime Cost:</span>
                  <strong className="text-orange-600">{LKR(engOTCost)}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Total Project Staff Financial Summary</span>
              <div className="flex items-center gap-4 flex-wrap font-extrabold text-sm">
                <span>Total Salary: <strong className="text-blue-600">{LKR(totalSalaryCost)}</strong></span>
                <span>Total OT: <strong className="text-orange-600">{LKR(totalOTCost)}</strong></span>
                <span className="text-purple-700 dark:text-purple-300 border-l pl-4 border-gray-300 dark:border-gray-600">Grand Total: {LKR(totalStaffCost)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      <StaffDetailsModal
        isOpen={Boolean(detailsTarget)}
        onClose={() => setDetailsTarget(null)}
        staff={detailsTarget}
        canEditCost={canEditCost}
        isAdminOrPM={isAdminOrPM}
        isClosed={isClosed}
        onOpenCost={(s) => setCostTarget(s)}
        onSetLead={handleSetLead}
        onRelease={(s) => setReleaseTarget(s)}
      />

      {/* Set Staff Cost Modal */}
      <SetStaffCostModal
        isOpen={Boolean(costTarget)}
        onClose={() => setCostTarget(null)}
        onSubmit={handleSetCost}
        staff={costTarget}
        isSubmitting={costLoading}
      />

      {/* Release Staff Modal */}
      <ReleaseStaffModal
        isOpen={Boolean(releaseTarget)}
        onClose={() => setReleaseTarget(null)}
        onConfirm={handleReleaseConfirm}
        staff={releaseTarget}
        isSubmitting={releaseLoading}
      />
    </div>
  );
}
