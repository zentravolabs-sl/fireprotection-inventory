// ============================================================
// src/app/(Main)/dashboard/project-stock/page.tsx
// Central Project Stock & Materials Return Page
// ============================================================

import React from "react";
import { prisma } from "@/lib/prisma";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import Link from "next/link";

export const revalidate = 0;

export default async function ProjectStockPage() {
  const projectMaterials = await prisma.projectMaterial.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        include: {
          customer: true,
          projectManager: true,
          engineers: { include: { engineer: true } },
        },
      },
      inventory: true,
      materialIssueItem: {
        include: {
          stockBatch: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Assigned Project Stock
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track all inventory items currently issued and assigned to active projects.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">FIFO Batch</th>
                <th className="px-4 py-3">Issued Qty</th>
                <th className="px-4 py-3">Returned Qty</th>
                <th className="px-4 py-3">Balance Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {projectMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No materials currently assigned to any project.
                  </td>
                </tr>
              ) : (
                projectMaterials.map((pm) => (
                  <tr key={pm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      <Link href={`/dashboard/projects/${pm.project.id}`} className="hover:underline">
                        {pm.project.projectName} ({pm.project.projectCode})
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{pm.inventory.name}</div>
                      <div className="text-xs text-gray-400">{pm.inventory.itemCode}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                      {pm.materialIssueItem?.stockBatch?.batchNo || `Batch #${pm.materialIssueItem?.stockBatchId}`}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-600">
                      {pm.issuedQty} {pm.inventory.unit}
                    </td>
                    <td className="px-4 py-3.5 text-orange-600">
                      {pm.returnedQty} {pm.inventory.unit}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-100">
                      {pm.balanceQty} {pm.inventory.unit}
                    </td>
                    <td className="px-4 py-3.5">
                      <ProjectStatusBadge status={pm.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/projects/${pm.project.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-md transition-colors inline-block"
                      >
                        Project Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
