// ============================================================
// src/app/(Main)/super-admin/layout.tsx
// Super Admin route layout — SUPER_ADMIN only.
// ============================================================

import { requireRole } from "@/lib/session";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("SUPER_ADMIN");

  return <>{children}</>;
}
