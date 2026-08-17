"use client";

// ============================================================
// src/components/dashboard/engineer/EngMyProjectsSection.tsx
// Assigned Projects Gallery for Engineer.
// ============================================================

import React from "react";
import Link from "next/link";
import { FolderCheck, MapPin, Calendar } from "lucide-react";
import { EngProjectItem } from "@/lib/services/engineerDashboardService";

interface EngMyProjectsSectionProps {
  projects: EngProjectItem[];
}

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  Planning: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  "On Hold": "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
};

export function EngMyProjectsSection({ projects }: EngMyProjectsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FolderCheck size={18} className="text-teal-600 dark:text-teal-400" />
            My Projects
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Fire protection engineering projects assigned for technical execution
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400">
          No assigned projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {projects.map((p) => {
            const badgeClass = statusStyles[p.status] || statusStyles.Active;

            return (
              <div
                key={p.id}
                className="p-4 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col justify-between hover:border-teal-300 dark:hover:border-teal-800 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors block leading-tight"
                      >
                        {p.projectName}
                      </Link>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium flex items-center gap-2">
                        <span>{p.clientName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <MapPin size={10} /> {p.siteLocation}
                        </span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badgeClass}`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Project Progress Bar */}
                  <div className="my-3">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-gray-400 font-sans text-[10px]">Project Progress</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {p.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* My Tasks breakdown on project */}
                  <div className="p-2.5 bg-white dark:bg-gray-800/80 rounded-lg border border-gray-100 dark:border-gray-700/60 my-2 text-[11px] flex items-center justify-between font-mono">
                    <span className="font-sans text-gray-500 font-semibold">My Tasks:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-400">{p.totalTasks} Total</span>
                      <span className="text-amber-600 dark:text-amber-400">{p.pendingTasks} Pending</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{p.completedTasks} Done</span>
                      <span className="text-red-600 dark:text-red-400">{p.overdueTasks} Overdue</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> Due: <strong className="font-mono text-gray-700 dark:text-gray-300">{p.dueDate}</strong>
                  </span>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
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
