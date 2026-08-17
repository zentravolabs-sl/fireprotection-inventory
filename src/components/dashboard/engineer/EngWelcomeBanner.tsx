"use client";

// ============================================================
// src/components/dashboard/engineer/EngWelcomeBanner.tsx
// Compact Welcome Banner displaying authenticated engineer name & date.
// ============================================================

import React from "react";
import { Calendar } from "lucide-react";

interface EngWelcomeBannerProps {
  userName: string;
  todaysTasksCount: number;
}

export function EngWelcomeBanner({ userName, todaysTasksCount }: EngWelcomeBannerProps) {
  const dateStr = new Date().toLocaleDateString("en-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Good Morning, {userName} 👋
        </h2>
        <p className="text-xs sm:text-sm text-teal-100 mt-1 font-medium">
          You have <strong className="text-white font-bold">{todaysTasksCount} tasks</strong> scheduled for today.
        </p>
      </div>

      <div className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-xs font-semibold text-teal-50 border border-white/20 flex items-center gap-2 self-start sm:self-auto shrink-0">
        <Calendar size={14} />
        <span>{dateStr}</span>
      </div>
    </div>
  );
}
