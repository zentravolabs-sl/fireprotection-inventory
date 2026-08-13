// ============================================================
// src/app/(Main)/layout.tsx
// Protected layout for all main application pages.
// Includes:
//   - FireGuard collapsible sidebar (desktop) / top bar (mobile)
//   - Persistent top navbar with user info & logout
//   - Persistent footer
// Any unauthenticated request is redirected to /login.
// ============================================================

import { requireSession } from "@/lib/session";
import { Sidebar, SidebarProvider, MobileTopBar } from "@/components/ui/Sidebar";
import "../sidebar.css";
import { SidebarOffsetWrapper } from "@/components/ui/SidebarOffsetWrapper";
import { TopNavbar } from "@/components/ui/TopNavbar";
import { AppFooter } from "@/components/ui/AppFooter";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireSession redirects to /login if no valid session exists.
  const session = await requireSession();
  const user = session.user as {
    name: string;
    email: string;
    role?: string;
  };

  return (
    <SidebarProvider>
      <div className="app-shell">
        {/* Mobile top bar — visible only on small screens via CSS */}
        <MobileTopBar />
        <Sidebar />
        <SidebarOffsetWrapper>
          {/* Sticky top navbar inside the content column */}
          <TopNavbar
            userName={user.name}
            userEmail={user.email}
            userRole={user.role}
          />

          {/* Page content */}
          <div className="app-content">
            {children}
          </div>

          {/* Footer at the bottom of the content column */}
          <AppFooter />
        </SidebarOffsetWrapper>
      </div>
    </SidebarProvider>
  );
}
