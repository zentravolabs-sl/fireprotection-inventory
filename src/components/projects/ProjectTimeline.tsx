"use client";

// ============================================================
// src/components/projects/ProjectTimeline.tsx
// Chronological Activity Timeline Component
// ============================================================

import React from "react";
import { ProjectTimelineEvent } from "@/types/project";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { formatDateTime } from "@/lib/dateUtils";

interface ProjectTimelineProps {
  events: ProjectTimelineEvent[];
}

export function ProjectTimeline({ events }: ProjectTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activity recorded for this project yet.
      </div>
    );
  }

  const getEventIcon = (type: ProjectTimelineEvent["type"]) => {
    switch (type) {
      case "CREATED":
        return (
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
            +
          </span>
        );
      case "ASSIGNMENT":
        return (
          <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
            👤
          </span>
        );
      case "REQUEST":
        return (
          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
            📋
          </span>
        );
      case "APPROVED":
        return (
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
            ✓
          </span>
        );
      case "ISSUED":
        return (
          <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-sm">
            📦
          </span>
        );
      case "RETURNED":
        return (
          <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
            ↩
          </span>
        );
      case "COMPLETED":
        return (
          <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
            🎉
          </span>
        );
      default:
        return (
          <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">
            •
          </span>
        );
    }
  };

  return (
    <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-6 my-4">
      {events.map((evt) => (
        <div key={evt.id} className="relative group">
          <div className="absolute -left-[41px] top-0 bg-white dark:bg-gray-900 rounded-full">
            {getEventIcon(evt.type)}
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {evt.title}
              </h4>
              <div className="flex items-center space-x-2">
                {evt.statusBadge && (
                  <ProjectStatusBadge status={evt.statusBadge} />
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(evt.timestamp)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {evt.description}
            </p>
            {evt.user && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Action by: <span className="font-medium text-gray-700 dark:text-gray-300">{evt.user}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
