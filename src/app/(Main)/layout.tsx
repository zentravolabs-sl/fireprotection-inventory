// ============================================================
// src/app/(Main)/layout.tsx
// Protected layout for all main application pages.
// Any unauthenticated request is redirected to /login.
// ============================================================

import { requireSession } from "@/lib/session";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireSession redirects to /login if no valid session exists.
  // The session is available here if needed for navigation etc.
  await requireSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
