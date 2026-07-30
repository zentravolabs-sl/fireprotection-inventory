// ============================================================
// src/app/(Main)/layout.tsx
// Protected layout for all main application pages.
// Includes the collapsible FireGuard sidebar.
// Any unauthenticated request is redirected to /login.
// ============================================================

import { requireSession } from "@/lib/session";
import { Sidebar, SidebarProvider, MobileTopBar } from "@/components/ui/Sidebar";
import "../sidebar.css";
import { SidebarOffsetWrapper } from "@/components/ui/SidebarOffsetWrapper";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireSession redirects to /login if no valid session exists.
  await requireSession();

  return (
    <SidebarProvider>
      <div className="app-shell">
        {/* Mobile top bar — visible only on small screens via CSS */}
        <MobileTopBar />
        <Sidebar />
        <SidebarOffsetWrapper>
          {children}
        </SidebarOffsetWrapper>
      </div>
    </SidebarProvider>
  );
}
