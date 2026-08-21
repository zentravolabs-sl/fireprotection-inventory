"use client";

// ============================================================
// src/components/ui/Sidebar.tsx
// Enterprise sidebar navigation for FIREPRO Fire Protection Management.
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
  superAdminOnly?: boolean;
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
  stockReceive: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  stockBatch: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  stockMovement: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

// ─── Navigation Data ──────────────────────────────────────────────────────────

const NAV_GROUPS_STATIC: NavGroup[] = [
  {
    title: "PROJECT MANAGEMENT",
    items: [
      { label: "Projects",          href: "/projects",          icon: Icons.projects,         permission: "project.view" },
      { label: "Material Reque...", href: "/material-requests", icon: Icons.materialRequests, permission: "material_request.view" },
      { label: "Project Stock",     href: "/project-stock",     icon: Icons.projectStock,     permission: "stock.view_history" },
    ],
  },
  {
    title: "WAREHOUSE",
    items: [
      { label: "Inventory Master",  href: "/inventory",         icon: Icons.inventory,        permission: "inventory.view" },
      { label: "Stock Receive",     href: "/stock-receive",     icon: Icons.stockReceive,     permission: "stock.receive" },
      { label: "Stock Batches",     href: "/stock-batch",       icon: Icons.stockBatch,       permission: "stock.view_history" },
      { label: "Stock Movements",   href: "/stock-movement",    icon: Icons.stockMovement,    permission: "stock.view_history" },
      { label: "Pipe & Cut Pieces", href: "/pipe-cut-pieces",   icon: Icons.pipe,             permission: "inventory.view" },
      { label: "Expiry Manage...",  href: "/expiry",            icon: Icons.expiry,           permission: "expiry.view" },
    ],
  },
  {
    title: "ASSETS & BUSINESS",
    items: [
      { label: "Tools",             href: "/tools",             icon: Icons.tools,            permission: "tool.view" },
      { label: "Suppliers",         href: "/suppliers",         icon: Icons.suppliers,        permission: "supplier.view" },
      { label: "Customers",         href: "/customers",         icon: Icons.customers,        permission: "customer.view" },
      { label: "Quotations",        href: "/quotations",        icon: Icons.quotations,       permission: "project.view" },
    ],
  },
  {
    title: "LABOUR",
    items: [
      { label: "Labour Types",      href: "/labour-types",      icon: Icons.labourTypes,      permission: "labour.view" },
      { label: "Labour Master",     href: "/labour",            icon: Icons.labour,           permission: "labour.view" },
    ],
  },
  {
    title: "FIRE EXTINGUISHERS",
    items: [
      { label: "Assignments",       href: "/fire-extinguishers/assignments", icon: Icons.fire,       permission: "fire_extinguisher.view" },
      { label: "Refill Management", href: "/fire-extinguishers/refills",     icon: Icons.returns,    permission: "fire_extinguisher.refill" },
      { label: "Client Deliveries", href: "/fire-extinguishers/deliveries",  icon: Icons.suppliers,  permission: "fire_extinguisher.deliver" },
      { label: "Physical Units",    href: "/fire-extinguishers/units",       icon: Icons.inventory,  permission: "fire_extinguisher.manage" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Reports",           href: "/reports",           icon: Icons.reports,          permission: "report.view" },
      { label: "Users & Roles",     href: "/users-roles",       icon: Icons.users,            permission: "user.view" },
      { label: "Audit Log",         href: "/audit-log",         icon: Icons.audit,            permission: "audit_log.view" },
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
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

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

// ─── Mobile Hamburger Button ──────────────────────────────────────────────────

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
        <span className="mobile-topbar-brand-name">FIREPRO</span>
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ────────────────────────────────────────────────────

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pendingMRCount = usePendingMRCount();
  const { can, userRole } = usePermissions();

  const closeMobile = () => setMobileOpen(false);

  // Filter nav groups & items based on current user permissions and role
  let NAV_GROUPS: NavGroup[] = [];

  if (userRole === "ENGINEER") {
    NAV_GROUPS = [
      {
        title: "MY WORK",
        items: [
          { label: "My Projects", href: "/projects", icon: Icons.projects },
          { label: "My Tasks", href: "/projects", icon: Icons.materialRequests },
          { label: "Today's Tasks", href: "/projects", icon: Icons.materialRequests },
          { label: "Upcoming Tasks", href: "/projects", icon: Icons.expiry },
        ],
      },
      {
        title: "SITE WORK",
        items: [
          { label: "Inspections", href: "/projects", icon: Icons.audit },
          { label: "Site Issues", href: "/projects", icon: Icons.audit },
          { label: "Site Activities", href: "/audit-log", icon: Icons.audit },
        ],
      },
      {
        title: "MATERIALS",
        items: [
          { label: "Material Requests", href: "/material-requests", icon: Icons.materialRequests, badge: pendingMRCount > 0 ? pendingMRCount : undefined },
        ],
      },
      {
        title: "REPORTS",
        items: [
          { label: "My Reports", href: "/reports", icon: Icons.reports },
        ],
      },
      {
        title: "OTHER",
        items: [
          { label: "Notifications", href: "/dashboard", icon: Icons.expiry },
          { label: "Profile", href: "/dashboard", icon: Icons.users },
        ],
      },
    ];
  } else if (userRole === "PROJECT_MANAGER") {
    NAV_GROUPS = [
      {
        title: "PROJECT MANAGEMENT",
        items: [
          { label: "My Projects", href: "/projects", icon: Icons.projects },
          { label: "Tasks", href: "/projects", icon: Icons.materialRequests },
          { label: "Team", href: "/users-roles", icon: Icons.users },
          { label: "Deadlines", href: "/projects", icon: Icons.expiry },
          { label: "Issues", href: "/projects", icon: Icons.audit },
        ],
      },
      {
        title: "MATERIALS",
        items: [
          { label: "Material Requests", href: "/material-requests", icon: Icons.materialRequests, badge: pendingMRCount > 0 ? pendingMRCount : undefined },
          { label: "Inventory", href: "/inventory", icon: Icons.inventory },
        ],
      },
      {
        title: "REPORTS",
        items: [
          { label: "Project Reports", href: "/reports", icon: Icons.reports },
          { label: "Progress Reports", href: "/reports", icon: Icons.reports },
        ],
      },
      {
        title: "OTHER",
        items: [
          { label: "Notifications", href: "/dashboard", icon: Icons.expiry },
          { label: "Profile", href: "/dashboard", icon: Icons.users },
        ],
      },
    ];
  } else if (userRole === "GENERAL_MANAGER") {
    NAV_GROUPS = [
      {
        title: "MANAGEMENT",
        items: [
          { label: "Projects", href: "/projects", icon: Icons.projects },
          { label: "Team", href: "/users-roles", icon: Icons.users },
          { label: "Clients", href: "/customers", icon: Icons.customers },
          { label: "Approvals", href: "/cost-approvals", icon: Icons.quotations },
        ],
      },
      {
        title: "FINANCE",
        items: [
          { label: "Project Budgets", href: "/projects", icon: Icons.quotations },
          { label: "Project Costs", href: "/reports", icon: Icons.reports },
          { label: "Financial Overview", href: "/reports", icon: Icons.reports },
        ],
      },
      {
        title: "REPORTS",
        items: [
          { label: "Management Reports", href: "/reports", icon: Icons.reports },
          { label: "Project Reports", href: "/reports", icon: Icons.reports },
        ],
      },
      {
        title: "OTHER",
        items: [
          { label: "Notifications", href: "/dashboard", icon: Icons.expiry },
          { label: "Profile", href: "/dashboard", icon: Icons.users },
        ],
      },
    ];
  } else if (userRole === "ACCOUNTANT") {
    NAV_GROUPS = [
      {
        title: "FINANCE",
        items: [
          { label: "Invoices", href: "/cost-approvals", icon: Icons.quotations },
          { label: "Payments", href: "/cost-approvals", icon: Icons.quotations },
          { label: "Expenses", href: "/reports", icon: Icons.reports },
          { label: "Project Costs", href: "/reports", icon: Icons.reports },
          { label: "Accounts Receivable", href: "/reports", icon: Icons.reports },
          { label: "Accounts Payable", href: "/reports", icon: Icons.reports },
        ],
      },
      {
        title: "REPORTS",
        items: [
          { label: "Financial Reports", href: "/reports", icon: Icons.reports },
          { label: "Project Financial Reports", href: "/reports", icon: Icons.reports },
        ],
      },
      {
        title: "OTHER",
        items: [
          { label: "Notifications", href: "/dashboard", icon: Icons.expiry },
          { label: "Profile", href: "/dashboard", icon: Icons.users },
        ],
      },
    ];
  } else {
    NAV_GROUPS = NAV_GROUPS_STATIC
      .map((group) => {
        const authorizedItems = group.items
          .filter((item) => {
            if (item.href === "/cost-approvals" && userRole !== "ADMIN") {
              return false;
            }
            if (item.superAdminOnly && userRole !== "SUPER_ADMIN") {
              return false;
            }
            return !item.permission || can(item.permission);
          })
          .map((item) =>
            item.href === "/material-requests" && pendingMRCount > 0
              ? { ...item, badge: pendingMRCount }
              : item,
          );

        return {
          ...group,
          items: authorizedItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }

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
              <span className="sidebar-logo-brand">FIREPRO</span>
              <span className="sidebar-logo-sub">Fire Protection Management</span>
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
                  key={item.href + item.label}
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
