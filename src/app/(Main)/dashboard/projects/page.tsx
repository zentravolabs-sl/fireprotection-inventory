// ============================================================
// src/app/(Main)/dashboard/projects/page.tsx
// Main Projects List & Dashboard Overview Page
// ============================================================

import React from "react";
import Link from "next/link";
import { findProjects, getDashboardStats } from "@/lib/repositories/projectRepository";
import { prisma } from "@/lib/prisma";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectsClientPage } from "./ProjectsClientPage";
import { ProjectStatus } from "@/types/project";
import { formatCurrency } from "@/lib/dateUtils";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ProjectsDashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";
  const status = (searchParams.status as ProjectStatus) || undefined;
  const page = Number(searchParams.page) || 1;

  const [stats, projectsResult, customers, users] = await Promise.all([
    getDashboardStats(),
    findProjects({ search, status, page, limit: 10 }),
    prisma.customer.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Project Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage Fire Protection projects, staff assignments, material requests & FIFO issues.
          </p>
        </div>
      </div>

      {/* 6 ERP Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Projects</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.activeProjects}</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Requests</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingMaterialRequests}</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Today</div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{stats.materialsIssuedToday}</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Returned Today</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.materialsReturnedToday}</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Projects</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completedProjects}</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Value</div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {formatCurrency(stats.totalInventoryValue)}
          </div>
        </div>
      </div>

      {/* Interactive Client Data Table & Filter Component */}
      <ProjectsClientPage
        projects={projectsResult.projects as any}
        total={projectsResult.total}
        page={projectsResult.page}
        totalPages={projectsResult.totalPages}
        customers={customers}
        users={users}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  );
}
