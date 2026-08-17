"use client";

// ============================================================
// src/components/dashboard/QuickActionsWidget.tsx
// Permission-gated Quick Action buttons for creating core entities.
// Navigates directly to each entity's dedicated module page.
// ============================================================

import React from "react";
import Link from "next/link";
import {
  FolderPlus,
  UserPlus,
  Users,
  PackagePlus,
  FilePlus,
  ShieldAlert,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface QuickActionsWidgetProps {
  userRole: string;
}

export function QuickActionsWidget({ userRole }: QuickActionsWidgetProps) {
  const { can } = usePermissions();

  const actions = [
    {
      label: "+ Add Project",
      href: "/projects",
      icon: <FolderPlus size={16} />,
      permission: "project.create",
      color: "bg-red-600 hover:bg-red-700 text-white border-red-600",
    },
    {
      label: "+ Add Client",
      href: "/customers",
      icon: <UserPlus size={16} />,
      permission: "customer.create",
      color: "bg-[#161d2e] hover:bg-[#1a2035] text-[#dce3ef] border-[#1e2a3d]",
    },
    {
      label: "+ Add Employee",
      href: "/users-roles",
      icon: <Users size={16} />,
      permission: "user.create",
      color: "bg-[#161d2e] hover:bg-[#1a2035] text-[#dce3ef] border-[#1e2a3d]",
    },
    {
      label: "+ Add Inventory Item",
      href: "/inventory",
      icon: <PackagePlus size={16} />,
      permission: "inventory.create",
      color: "bg-[#161d2e] hover:bg-[#1a2035] text-[#dce3ef] border-[#1e2a3d]",
    },
    {
      label: "+ Create Material Request",
      href: "/material-requests",
      icon: <FilePlus size={16} />,
      permission: "material_request.create",
      color: "bg-[#161d2e] hover:bg-[#1a2035] text-[#dce3ef] border-[#1e2a3d]",
    },
    {
      label: "+ Create Quotation",
      href: "/quotations",
      icon: <FilePlus size={16} />,
      permission: "project.view",
      color: "bg-[#161d2e] hover:bg-[#1a2035] text-[#dce3ef] border-[#1e2a3d]",
    },
  ];

  const allowedActions = actions.filter((a) => !a.permission || can(a.permission));

  return (
    <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#dce3ef] flex items-center gap-2">
          <ShieldAlert size={18} className="text-[#e02424]" />
          Quick System Actions
        </h3>
        <span className="text-xs text-[#5a657a]">
          Role-gated operational shortcuts
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {allowedActions.map((act) => (
          <Link
            key={act.label}
            href={act.href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 shadow-xs ${act.color}`}
          >
            {act.icon}
            {act.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
