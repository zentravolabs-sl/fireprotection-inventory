"use client";

// ============================================================
// src/components/ui/Sidebar.tsx
// Collapsible sidebar navigation for FireGuard ERP.
// Color theme: dark navy/charcoal bg (#0F1524 / #161d2e),
// red accent (#e02424 / #ff2d2d), muted text (#5a657a).
// Mobile: slide-in drawer with overlay backdrop.
// ============================================================

import React, { useState, createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePendingMRCount } from "@/components/ui/NotificationBell";
import { usePermissions } from "@/hooks/usePermissions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  permission?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// ─── Icons (inline SVG to avoid extra deps) ───────────────────────────────────

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  projects: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  materialRequests: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  projectStock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  inventory: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  pipe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  issueNotes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  returns: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
    </svg>
  ),
  expiry: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  tools: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  suppliers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  customers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  quotations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  audit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  fire: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0C17 8 12 2 12 2zm0 15a3 3 0 0 1-3-3c0-2.5 3-7 3-7s3 4.5 3 7a3 3 0 0 1-3 3z"/>
    </svg>
  ),
  hamburger: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  labourTypes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="23" y2="8" /><line x1="21" y1="6" x2="21" y2="10" />
    </svg>
  ),
  labour: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      <path d="M12 14v3m-3-2h6" />
    </svg>
  ),
  categories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M3 14h7v7H3z" />
      <path d="M14 17.5h7" /><path d="M17.5 14v7" />
    </svg>
  ),
  subCategories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="4" rx="1" />
      <rect x="3" y="10" width="5" height="4" rx="1" />
      <rect x="3" y="17" width="5" height="4" rx="1" />
      <line x1="8" y1="12" x2="14" y2="12" />
      <line x1="8" y1="19" x2="14" y2="19" />
      <line x1="14" y1="12" x2="14" y2="19" />
      <rect x="14" y="9" width="7" height="5" rx="1" />
      <rect x="14" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
};

// ─── Navigation Data ──────────────────────────────────────────────────────────

const NAV_GROUPS_STATIC: NavGroup[] = [
  {
    title: "PROJECT MANAGEMENT",
    items: [
      { label: "Projects",          href: "/projects",          icon: Icons.projects,         permission: "project.view" },
      { label: "Material Requests", href: "/material-requests", icon: Icons.materialRequests, permission: "material_request.view" },
      { label: "Project Stock",     href: "/project-stock",    icon: Icons.projectStock,      permission: "stock.view_history" },
      { label: "Project Transfers", href: "/transfers",        icon: Icons.returns,           permission: "project_transfer.view" },
    ],
  },
  {
    title: "WAREHOUSE",
    items: [
      { label: "Categories",        href: "/categories",       icon: Icons.categories,        permission: "inventory.view" },
      { label: "Sub-Categories",    href: "/sub-categories",   icon: Icons.subCategories,    permission: "inventory.view" },
      { label: "Inventory Master",  href: "/inventory",        icon: Icons.inventory,        permission: "inventory.view" },
      { label: "Stock Receive",     href: "/stock-receive",    icon: Icons.suppliers,        permission: "stock.receive" },
      { label: "Stock Batches",     href: "/stock-batch",      icon: Icons.projectStock,      permission: "stock.view_history" },
      { label: "Stock Movements",   href: "/stock-movement",   icon: Icons.reports,           permission: "stock.view_history" },
      { label: "Pipe & Cut Pieces", href: "/pipe-cut-pieces",  icon: Icons.pipe,              permission: "stock.view_history" },
      { label: "Expiry Management", href: "/expiry",           icon: Icons.expiry,            permission: "expiry.view" },
    ],
  },
  {
    title: "ASSETS & BUSINESS",
    items: [
      { label: "Tools",             href: "/tools",            icon: Icons.tools,            permission: "tool.view" },
      { label: "Suppliers",         href: "/suppliers",        icon: Icons.suppliers,        permission: "supplier.view" },
      { label: "Customers",         href: "/customers",        icon: Icons.customers,        permission: "customer.view" },
      { label: "Quotations",        href: "/quotations",       icon: Icons.quotations,       permission: "project.view" },
    ],
  },
  {
    title: "LABOUR",
    items: [
      { label: "Labour Types",      href: "/labour-types",     icon: Icons.labourTypes,      permission: "labour.view" },
      { label: "Labour Master",     href: "/labour",           icon: Icons.labour,           permission: "labour.view" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Reports",           href: "/reports",          icon: Icons.reports,          permission: "report.view" },
      { label: "Users & Roles",     href: "/users-roles",      icon: Icons.users,            permission: "user.view" },
      { label: "Audit Log",         href: "/audit-log",        icon: Icons.audit,            permission: "audit_log.view" },
    ],
  },
];

// ─── NavItem Component ─────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={`sidebar-nav-item ${isActive ? "active" : ""}`}
      onClick={onNavigate}
    >
      <span className="sidebar-nav-icon">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="sidebar-nav-label">{item.label}</span>
          {item.badge !== undefined && (
            <span className="sidebar-nav-badge">{item.badge}</span>
          )}
        </>
      )}
      {collapsed && item.badge !== undefined && (
        <span className="sidebar-nav-badge-dot" />
      )}
    </Link>
  );
}

// ─── Context Provider ─────────────────────────────────────────────────────────

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ─── Mobile Hamburger Button (exported for use in layouts) ────────────────────

export function MobileMenuButton() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <button
      className="mobile-hamburger"
      onClick={() => setMobileOpen(!mobileOpen)}
      aria-label={mobileOpen ? "Close menu" : "Open menu"}
    >
      {mobileOpen ? Icons.close : Icons.hamburger}
    </button>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

export function MobileTopBar() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <div className="mobile-topbar">
      <button
        className="mobile-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? Icons.close : Icons.hamburger}
      </button>
      <div className="mobile-topbar-brand">
        <div className="mobile-topbar-brand-icon">
          <span style={{ color: "#fff", display: "flex" }}>{Icons.fire}</span>
        </div>
        <span className="mobile-topbar-brand-name">FireGuard ERP</span>
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ────────────────────────────────────────────────────

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pendingMRCount = usePendingMRCount();
  const { can } = usePermissions();

  const closeMobile = () => setMobileOpen(false);

  // Filter nav groups & items based on current user permissions
  const NAV_GROUPS: NavGroup[] = NAV_GROUPS_STATIC.map((group) => {
    const authorizedItems = group.items
      .filter((item) => !item.permission || can(item.permission))
      .map((item) =>
        item.href === "/material-requests" && pendingMRCount > 0
          ? { ...item, badge: pendingMRCount }
          : item,
      );

    return {
      ...group,
      items: authorizedItems,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <>
      {/* Overlay backdrop (mobile only) */}
      <div
        className={`sidebar-overlay ${mobileOpen ? "sidebar-overlay--visible" : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
        {/* ── Logo + Collapse Toggle ── */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span className="sidebar-logo-fire">{Icons.fire}</span>
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-brand">FireGuard</span>
              <span className="sidebar-logo-sub">ERP SYSTEM</span>
            </div>
          )}
          <button
            className="sidebar-toggle sidebar-toggle--top"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? Icons.chevronRight : Icons.chevronLeft}
          </button>
        </div>

        {/* ── Dashboard link ── */}
        <div className="sidebar-dashboard-link">
          <SidebarNavItem
            item={{ label: "Dashboard", href: "/dashboard", icon: Icons.dashboard }}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
        </div>

        {/* ── Nav Groups ── */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="sidebar-group">
              {!collapsed && (
                <p className="sidebar-group-title">{group.title}</p>
              )}
              {collapsed && <div className="sidebar-group-divider" />}
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={closeMobile}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
