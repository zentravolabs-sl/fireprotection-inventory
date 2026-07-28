"use client";

// ============================================================
// src/components/ui/SidebarOffsetWrapper.tsx
// Client wrapper that reads the sidebar collapsed state and
// applies the correct margin-left to the main content area.
// ============================================================

import React from "react";
import { useSidebar } from "./Sidebar";

export function SidebarOffsetWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={`sidebar-offset ${collapsed ? "sidebar-offset--collapsed" : ""}`}
      style={{ minHeight: "100vh", background: "#080c12" }}
    >
      {children}
    </main>
  );
}
