// ============================================================
// src/app/(Main)/admin/layout.tsx
// Admin route layout — ADMIN or SUPER_ADMIN only.
// Server-side RBAC guard (middleware is the first layer;
// this layout is the server component second layer).
// ============================================================

import { requireRole } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Throws a redirect to /dashboard if role is insufficient.
  await requireRole("ADMIN", "SUPER_ADMIN");

  return <>{children}</>;
}
