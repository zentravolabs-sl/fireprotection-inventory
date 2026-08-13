"use client";

// ============================================================
// src/app/(Main)/expiry/calendar/page.tsx
// Interactive Expiry Calendar Page.
// Displays stock batch expirations on a monthly calendar grid.
// ============================================================

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { getExpiryCalendarEventsAction } from "../actions";
import BatchDetailsModal from "@/components/expiry/BatchDetailsModal";
import type { ExpiryCalendarEvent } from "@/lib/services/expiryService";

export const dynamic = "force-dynamic";

export default function ExpiryCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ExpiryCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const month = currentDate.getMonth() + 1; // 1-indexed
  const year = currentDate.getFullYear();

  const loadCalendarEvents = () => {
    setLoading(true);
    startTransition(async () => {
      const res = await getExpiryCalendarEventsAction(month, year);
      if (res.success && res.data) {
        setEvents(res.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCalendarEvents();
  }, [month, year]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  // Calendar Grid Generation Helper
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const formatCurrency = (val: number) =>
    `LKR ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Group events by day of month (1 to 31)
  const eventsByDay = new Map<number, ExpiryCalendarEvent[]>();
  events.forEach((ev) => {
    const d = new Date(ev.expiryDate).getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(ev);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <Link
            href="/expiry"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Expiry Management
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Inventory Expiry Calendar
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Visual calendar schedule of stock batch expirations and upcoming alert windows.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={prevMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-colors shadow-sm"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-black text-gray-900 px-3 min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-colors shadow-sm"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-200/80 shadow-sm text-xs font-bold text-gray-700">
        <span className="text-gray-500">Legend:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg">
          <ShieldAlert size={13} /> EXPIRED Batch
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg">
          <Clock size={13} /> EXPIRING SOON
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
          <CheckCircle2 size={13} /> VALID / UPCOMING
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-center text-xs font-black text-gray-500 uppercase py-3">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 bg-gray-100">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/50 p-2" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = eventsByDay.get(dayNum) || [];
            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() + 1 === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[120px] bg-white p-2.5 flex flex-col justify-start transition-colors ${
                  isToday ? "bg-red-50/20 ring-2 ring-red-500/30 inset-0 z-10" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-red-600 text-white" : "text-gray-700"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-500">
                      {dayEvents.length} batch(es)
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[100px] pr-0.5">
                  {dayEvents.map((ev) => {
                    const isExpired = ev.status === "EXPIRED";
                    const isSoon = ev.status === "EXPIRING_SOON";

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedBatchId(ev.id)}
                        className={`p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
                          isExpired
                            ? "bg-red-100 text-red-800 border-red-300"
                            : isSoon
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border-emerald-300"
                        }`}
                      >
                        <div className="truncate font-extrabold">{ev.itemName}</div>
                        <div className="text-[10px] opacity-80 flex items-center justify-between font-mono mt-0.5">
                          <span>{ev.batchNo}</span>
                          <span>{ev.availableQty} {ev.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatchId && (
        <BatchDetailsModal
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
        />
      )}
    </div>
  );
}
