// ============================================================
// src/app/(Main)/dashboard/page.tsx
// Main dashboard — accessible to all authenticated users.
// ============================================================

import { requireSession } from "@/lib/session";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, Shield, User } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export const metadata = {
  title: "Dashboard — CDN Fire Engineering",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const user = session.user as {
    name: string;
    email: string;
    role?: string;
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    ADMIN: "bg-blue-100 text-blue-700",
    USER: "bg-gray-100 text-gray-700",
  };

  const roleColor = roleColors[user.role ?? "USER"] ?? roleColors.USER;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-red-600" />
            <span className="font-black text-gray-900 text-lg tracking-tight">
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
            <span className="text-sm text-gray-600 font-medium hidden sm:block">
              {user.name}
            </span>
            {/* Logout form — logoutAction returns void, compatible with form action */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            Welcome back, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">{user.email}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "Account Status", value: "Active", color: "text-green-600", bg: "bg-green-50" },
            { label: "Role", value: user.role ?? "USER", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Session", value: "Authenticated", color: "text-purple-600", bg: "bg-purple-50" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/change-password"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Settings size={16} />
              Change Password
            </Link>
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors"
              >
                <Shield size={16} />
                Admin Panel
              </Link>
            )}
            {user.role === "SUPER_ADMIN" && (
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-xl transition-colors"
              >
                <User size={16} />
                Super Admin Panel
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
