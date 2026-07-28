// ============================================================
// src/app/(Main)/admin/page.tsx
// Admin panel — ADMIN and SUPER_ADMIN access.
// ============================================================

import { requireRole } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Admin Panel — CDN Fire Engineering",
};

export default async function AdminPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  const user = session.user as { name: string; role?: string };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" />
            <span className="font-bold text-gray-800">Admin Panel</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-500 mb-8">
          Logged in as <strong>{user.name}</strong> ({user.role})
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Users size={40} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Admin Management Area
          </h2>
          <p className="text-gray-400 text-sm">
            User management, reports, and system configuration will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
