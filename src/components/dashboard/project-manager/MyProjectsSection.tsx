"use client";

// ============================================================
// src/components/dashboard/project-manager/MyProjectsSection.tsx
// Large Assigned Projects Gallery for Project Manager.
// ============================================================

import React from "react";
import Link from "next/link";
import { FolderCheck, Users, Calendar, ArrowRight } from "lucide-react";
import { MyProjectItem } from "@/lib/services/projectManagerDashboardService";

interface MyProjectsSectionProps {
  projects: MyProjectItem[];
}

const statusBadgeStyles: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  Planning: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  "On Hold": "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
};

const priorityStyles: Record<string, string> = {
  Low: "text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  Medium: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  High: "text-amber-800 bg-amber-100 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300",
  Critical: "text-red-800 bg-red-100 border-red-300 dark:bg-red-950/80 dark:text-red-300 font-bold animate-pulse",
};

export function MyProjectsSection({ projects }: MyProjectsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FolderCheck size={18} className="text-blue-600 dark:text-blue-400" />
            My Projects
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Active fire protection projects assigned for site management & execution
          </p>
        </div>
        <Link
          href="/projects"
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1"
        >
          View All Projects <ArrowRight size={12} />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400">
          No assigned projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const statusClass = statusBadgeStyles[p.status] || statusBadgeStyles.Active;
            const priorityClass = priorityStyles[p.priority] || priorityStyles.Medium;

            return (
              <div
                key={p.id}
                className="p-4 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block leading-tight"
                      >
                        {p.projectName}
                      </Link>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        {p.clientName}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded-md border ${priorityClass}`}>
                      {p.priority}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-gray-400 font-sans text-[10px]">Progress</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {p.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-100 dark:border-gray-800/60 mb-3">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar size={12} />
                      <span>Due: <strong className="font-mono text-gray-700 dark:text-gray-300">{p.dueDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Users size={12} />
                      <span>Engineers: <strong className="font-mono text-gray-700 dark:text-gray-300">{p.engineersCount}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="flex items-center justify-between pt-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusClass}`}>
                    {p.status}
                  </span>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
