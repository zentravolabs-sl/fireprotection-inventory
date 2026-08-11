// ============================================================
// src/app/(Main)/dashboard/page.tsx
// Main dashboard — accessible to all authenticated users.
// ============================================================

import { requireSession } from "@/lib/session";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, Shield, User, Wrench, AlertTriangle, Clock } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getToolDashboardStats } from "@/lib/repositories/toolAssignmentRepository";
import { getExpiryDashboardData } from "@/lib/services/expiryService";

export const revalidate = 0;

export const metadata = {
  title: "Dashboard — CDN Fire Engineering",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const [toolStats, expiryData] = await Promise.all([
    getToolDashboardStats(),
    getExpiryDashboardData(),
  ]);
  const user = session.user as {
    name: string;
    email: string;
    role?: string;
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-900/40 text-purple-300 border border-purple-700/40",
    ADMIN: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
    USER: "bg-[#1e2a3d] text-[#dce3ef] border border-[#1e2a3d]",
  };

  const roleColor = roleColors[user.role ?? "USER"] ?? roleColors.USER;

  return (
    <div className="min-h-screen bg-[#080c12]">
      {/* Top navigation */}
      <nav className="bg-[#0F1524] border-b border-[#1e2a3d] shadow-[0_1px_0_0_#1e2a3d,0_4px_24px_rgba(0,0,0,0.45)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-[#e02424]" />
            <span className="font-black text-[#dce3ef] text-lg tracking-tight">
              CDN Fire Engineering
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor}`}
            >
              <Shield size={12} />
              {user.role ?? "USER"}
            </span>
            <span className="text-sm text-[#5a657a] font-medium hidden sm:block">
              {user.name}
            </span>
            {/* Logout form — logoutAction returns void, compatible with form action */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a657a] hover:text-[#e02424] transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">
            Welcome back, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-[#5a657a] mt-1 text-sm sm:text-base break-all">{user.email}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "Account Status", value: "Active", color: "text-green-400", bg: "bg-green-900/20 border-green-800/30" },
            { label: "Role", value: user.role ?? "USER", color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800/30" },
            { label: "Session", value: "Authenticated", color: "text-purple-400", bg: "bg-purple-900/20 border-purple-800/30" },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border shadow-sm p-6 ${card.bg} bg-[#0F1524]`}
            >
              <p className="text-sm text-[#5a657a] font-medium">{card.label}</p>
              <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#dce3ef] mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/change-password"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#161d2e] hover:bg-[#1a2035] text-[#dce3ef] text-sm font-semibold rounded-xl border border-[#1e2a3d] transition-colors"
            >
              <Settings size={16} />
              Change Password
            </Link>
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 text-sm font-semibold rounded-xl border border-blue-800/40 transition-colors"
              >
                <Shield size={16} />
                Admin Panel
              </Link>
            )}
            {user.role === "SUPER_ADMIN" && (
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-sm font-semibold rounded-xl border border-purple-800/40 transition-colors"
              >
                <User size={16} />
                Super Admin Panel
              </Link>
            )}
          </div>
        </div>
        {/* Tool stats */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#dce3ef] mb-4 flex items-center gap-2">
            <Wrench size={18} className="text-[#e02424]" />
            Tool Status Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Available", value: toolStats.available, color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/30" },
              { label: "In Use", value: toolStats.inUse, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800/30" },
              { label: "Under Repair", value: toolStats.maintenance, color: "text-orange-400", bg: "bg-orange-900/20 border-orange-800/30" },
              { label: "Lost", value: toolStats.lost, color: "text-red-400", bg: "bg-red-900/20 border-red-800/30" },
              { label: "Overdue Returns", value: toolStats.overdueReturns, color: toolStats.overdueReturns > 0 ? "text-yellow-400" : "text-gray-400", bg: toolStats.overdueReturns > 0 ? "bg-yellow-900/20 border-yellow-800/30" : "bg-[#161d2e] border-[#1e2a3d]" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl border shadow-sm p-5 bg-[#0F1524] ${stat.bg}`}>
                <p className="text-sm text-[#5a657a] font-medium">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                {stat.label === "Overdue Returns" && toolStats.overdueReturns > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} className="text-yellow-400" />
                    <span className="text-[11px] text-yellow-400 font-semibold">Action needed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link
              href="/admin/tools"
              className="text-sm text-[#e02424] hover:underline font-semibold"
            >
              → Manage Tools
            </Link>
          </div>
        </div>

        {/* Expiry Status Overview */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#dce3ef] flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              Stock Expiry Overview
            </h2>
            <Link
              href="/inventory/expiry"
              className="text-sm text-[#e02424] hover:underline font-semibold"
            >
              View Expiry Dashboard →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-red-800/30 bg-red-900/10 p-5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Expired Stock Value</p>
              <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">
                LKR {(expiryData?.expiredStockValue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-[#5a657a] mt-1">{expiryData?.expiredBatchesCount || 0} batches expired</p>
            </div>

            <div className="rounded-2xl border border-amber-800/30 bg-amber-900/10 p-5">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Expiring $\le$ 7 Days</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                LKR {(expiryData?.expiring7DaysValue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-[#5a657a] mt-1">{expiryData?.expiring7DaysCount || 0} batches expiring soon</p>
            </div>

            <div className="rounded-2xl border border-amber-800/30 bg-amber-900/10 p-5">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Expiring $\le$ 30 Days</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                LKR {(expiryData?.expiring30DaysValue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-[#5a657a] mt-1">{expiryData?.expiring30DaysCount || 0} batches warning</p>
            </div>

            <div className="rounded-2xl border border-[#1e2a3d] bg-[#0F1524] p-5">
              <p className="text-xs font-semibold text-[#5a657a] uppercase tracking-wider">Expiry-Controlled Items</p>
              <p className="text-xl sm:text-2xl font-black text-[#dce3ef] mt-1">
                {expiryData?.totalExpiryControlledItems || 0}
              </p>
              <p className="text-xs text-[#5a657a] mt-1">Items requiring FEFO</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
