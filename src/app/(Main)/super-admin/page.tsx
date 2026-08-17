// ============================================================
// src/app/(Main)/super-admin/page.tsx
// Super Admin panel — SUPER_ADMIN only.
// ============================================================

import { requireRole } from "@/lib/session";
import { Crown, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Super Admin — CDN Fire Engineering",
};

export default async function SuperAdminPage() {
  const session = await requireRole("SUPER_ADMIN");
  const user = session.user as { name: string; role?: string };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
          <Crown size={28} className="text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-[#dce3ef] mb-1">
          System Administration
        </h2>
        <p className="text-[#5a657a] text-sm mb-1">
          Logged in as <strong className="text-[#dce3ef]">{user.name}</strong>{" "}
          <span className="text-[#3d4c62]">({user.role})</span>
        </p>
        <p className="text-[#3d4c62] text-sm mt-3 flex items-center justify-center gap-2">
          <Database size={14} />
          Full system access including user roles, audit logs, and database controls.
        </p>
      </div>
    </div>
  );
}
