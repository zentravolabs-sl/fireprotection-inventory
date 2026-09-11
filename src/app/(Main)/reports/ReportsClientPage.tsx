"use client";

// ============================================================
// src/app/(Main)/reports/ReportsClientPage.tsx
// Client component for Central Fire Protection ERP Reports
// ============================================================

import React, { useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/dateUtils";
import { ScrollableTabs, TabItem } from "@/components/ui/ScrollableTabs";
import { Download, Loader2 } from "lucide-react";

interface ReportsClientPageProps {
  costSummaryReport: any[];
  categoryExpenseReport: any[];
  transportReport: any[];
  engineerReport: any[];
  customerReport: any[];
  transferReport?: any[];
}

type ReportTabType =
  | "cost-summary"
  | "material"
  | "transport"
  | "labour"
  | "expense-analysis"
  | "budget-vs-actual"
  | "profit-loss"
  | "engineers"
  | "customers"
  | "transfers";

export function ReportsClientPage({
  costSummaryReport,
  categoryExpenseReport,
  transportReport,
  engineerReport,
  customerReport,
  transferReport = [],
}: ReportsClientPageProps) {
  const [activeReport, setActiveReport] = useState<ReportTabType>("cost-summary");

  const totalEstimatedOverall = costSummaryReport.reduce((sum, r) => sum + r.estimatedTotalCost, 0);
  const totalActualOverall = costSummaryReport.reduce((sum, r) => sum + r.actualTotalCost, 0);
  const totalVarianceOverall = totalEstimatedOverall - totalActualOverall;

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  async function handleDownloadWeeklyPDF() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      // 1. Fetch report data
      const res = await fetch("/api/reports/weekly-stock/download");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = await res.json() as {
        reportPeriod: { from: string; to: string };
        summary: {
          openingStock: number; stockIn: number; stockOut: number;
          adjustments: number; currentStock: number;
          lowStockCount: number; outOfStockCount: number;
        };
        stockMovementItems: Array<{ name: string; categoryName: string; openingQty: number; receivedQty: number; usedQty: number; remainingQty: number; }>;
        topUsedItems: Array<{ rank: number; name: string; categoryName: string; usedQty: number; unit: string; }>;
        lowStockItems: Array<{ name: string; categoryName: string; currentStock: number; minStock: number; requiredQty: number; unit: string; }>;
        outOfStockItems: Array<{ name: string; categoryName: string; minStock: number; unit: string; }>;
      };

      const from = new Date(data.reportPeriod.from);
      const to = new Date(data.reportPeriod.to);
      const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const fmtNum = (n: number) => n.toLocaleString("en-US");
      const periodLabel = `${fmtDate(from)} – ${fmtDate(to)}`;

      // 2. Build HTML string for the PDF
      const buildSectionTitle = (title: string, color = "#b91c1c") =>
        `<h3 style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};margin:0 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">${title}</h3>`;

      const summaryRows = [
        { label: "Opening Stock", value: data.summary.openingStock, color: "#111827" },
        { label: "+ Received", value: data.summary.stockIn, color: "#16a34a" },
        { label: "− Used / Issued", value: data.summary.stockOut, color: "#b91c1c" },
        { label: "± Adjustments", value: data.summary.adjustments, color: "#6b7280" },
        { label: "= Current Stock", value: data.summary.currentStock, color: "#1d4ed8" },
      ];

      const htmlContent = `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111827;max-width:900px;margin:0 auto;padding:32px 40px;background:#fff;">
          <!-- Header -->
          <div style="background:#b91c1c;border-radius:10px;padding:28px 32px 22px;margin-bottom:28px;">
            <p style="color:#fecaca;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 4px;">CDN FIRE ENGINEERING</p>
            <h1 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 4px;letter-spacing:-0.5px;">Weekly Stock Report</h1>
            <p style="color:#fca5a5;font-size:12px;margin:0 0 14px;">Fire Protection Management System</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.25);margin:0 0 12px;"/>
            <p style="color:#fecaca;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 3px;">Report Period</p>
            <p style="color:#fff;font-size:16px;font-weight:700;margin:0;">${periodLabel}</p>
          </div>

          <!-- KPI Cards -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Opening Stock</p>
              <p style="font-size:26px;font-weight:700;color:#111827;margin:0;">${fmtNum(data.summary.openingStock)}</p>
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:3px solid #16a34a;border-radius:8px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Received</p>
              <p style="font-size:26px;font-weight:700;color:#16a34a;margin:0;">${fmtNum(data.summary.stockIn)}</p>
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:3px solid #b91c1c;border-radius:8px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Used / Issued</p>
              <p style="font-size:26px;font-weight:700;color:#b91c1c;margin:0;">${fmtNum(data.summary.stockOut)}</p>
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:3px solid #1d4ed8;border-radius:8px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Current Stock</p>
              <p style="font-size:26px;font-weight:700;color:#1d4ed8;margin:0;">${fmtNum(data.summary.currentStock)}</p>
            </div>
          </div>

          <!-- Stock Movement Summary -->
          <div style="margin-bottom:28px;">
            ${buildSectionTitle("Stock Movement Summary")}
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <tbody>
                ${summaryRows.map((r, i) => `
                  <tr style="border-top:${i === summaryRows.length - 1 ? "2px solid #e5e7eb" : "1px solid #f3f4f6"};">
                    <td style="padding:8px 0;font-weight:${i === summaryRows.length - 1 ? "700" : "400"};color:#374151;">${r.label}</td>
                    <td style="padding:8px 0;text-align:right;font-weight:600;color:${r.color};">${fmtNum(r.value)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Stock Used This Week -->
          <div style="margin-bottom:28px;">
            ${buildSectionTitle("Stock Used This Week")}
            ${data.stockMovementItems.length === 0
              ? `<p style="font-size:12px;color:#6b7280;">No stock movement was recorded during this reporting period.</p>`
              : `<table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="text-align:left;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Item</th>
                      <th style="text-align:left;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Category</th>
                      <th style="text-align:right;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Opening</th>
                      <th style="text-align:right;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Received</th>
                      <th style="text-align:right;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Used</th>
                      <th style="text-align:right;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.stockMovementItems.map(item => `
                      <tr>
                        <td style="padding:8px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${item.name}</td>
                        <td style="padding:8px;color:#6b7280;font-size:11px;border-bottom:1px solid #f3f4f6;">${item.categoryName}</td>
                        <td style="padding:8px;text-align:right;font-weight:600;border-bottom:1px solid #f3f4f6;">${fmtNum(item.openingQty)}</td>
                        <td style="padding:8px;text-align:right;font-weight:600;color:#16a34a;border-bottom:1px solid #f3f4f6;">+${fmtNum(item.receivedQty)}</td>
                        <td style="padding:8px;text-align:right;font-weight:600;color:#b91c1c;border-bottom:1px solid #f3f4f6;">−${fmtNum(item.usedQty)}</td>
                        <td style="padding:8px;text-align:right;font-weight:600;border-bottom:1px solid #f3f4f6;">${fmtNum(item.remainingQty)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>`
            }
          </div>

          ${data.topUsedItems.length > 0 ? `
          <!-- Top Used Materials -->
          <div style="margin-bottom:28px;">
            ${buildSectionTitle("Top Used Materials This Week")}
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="text-align:left;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;width:8%">#</th>
                  <th style="text-align:left;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Item</th>
                  <th style="text-align:left;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Category</th>
                  <th style="text-align:right;padding:8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Qty Used</th>
                </tr>
              </thead>
              <tbody>
                ${data.topUsedItems.map(item => `
                  <tr>
                    <td style="padding:8px;color:#9ca3af;font-weight:700;border-bottom:1px solid #f3f4f6;">${item.rank}</td>
                    <td style="padding:8px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${item.name}</td>
                    <td style="padding:8px;color:#6b7280;font-size:11px;border-bottom:1px solid #f3f4f6;">${item.categoryName}</td>
                    <td style="padding:8px;text-align:right;font-weight:600;color:#b91c1c;border-bottom:1px solid #f3f4f6;">${fmtNum(item.usedQty)} ${item.unit}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          ` : ""}

          <!-- Low Stock Alert -->
          <div style="margin-bottom:28px;">
            ${buildSectionTitle(data.summary.lowStockCount > 0 ? "⚠ Low Stock Alert" : "Low Stock Alert", data.summary.lowStockCount > 0 ? "#c2410c" : "#6b7280")}
            ${data.lowStockItems.length === 0
              ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;font-size:12px;color:#16a34a;">✓ No low-stock items this week.</div>`
              : data.lowStockItems.map(item => `
                  <div style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #f97316;border-radius:6px;padding:10px 14px;margin-bottom:8px;">
                    <p style="font-size:12px;font-weight:700;color:#9a3412;margin:0 0 3px;">${item.name}</p>
                    <p style="font-size:11px;color:#c2410c;margin:0;">${item.categoryName} | Current: <strong>${fmtNum(item.currentStock)}</strong> | Min: <strong>${fmtNum(item.minStock)}</strong> | Need: <strong style="color:#b91c1c;">${fmtNum(item.requiredQty)}</strong> | LOW STOCK</p>
                  </div>
                `).join("")
            }
          </div>

          <!-- Out of Stock -->
          <div style="margin-bottom:28px;">
            ${buildSectionTitle(data.summary.outOfStockCount > 0 ? "🚨 Out of Stock" : "Out of Stock", data.summary.outOfStockCount > 0 ? "#b91c1c" : "#6b7280")}
            ${data.outOfStockItems.length === 0
              ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;font-size:12px;color:#16a34a;">✓ No items are currently out of stock.</div>`
              : data.outOfStockItems.map(item => `
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:6px;padding:10px 14px;margin-bottom:8px;">
                    <p style="font-size:12px;font-weight:700;color:#7f1d1d;margin:0 0 3px;">${item.name}</p>
                    <p style="font-size:11px;color:#b91c1c;margin:0;">${item.categoryName} | Current Stock: <strong>0</strong> | Min Level: <strong>${fmtNum(item.minStock)}</strong> | <strong>OUT OF STOCK</strong></p>
                  </div>
                `).join("")
            }
          </div>

          <!-- Footer -->
          <div style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:8px;padding:16px 24px;margin-top:20px;text-align:center;">
            <p style="font-size:11px;font-weight:700;color:#374151;margin:0 0 4px;">CDN Fire Engineering — Fire Protection Management System</p>
            <p style="font-size:10px;color:#9ca3af;margin:0;">This report was generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} IST</p>
          </div>
        </div>
      `;

      // 3. Render HTML into a hidden off-screen div
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:960px;background:#fff;z-index:-1;";
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      // 4. Capture with html2canvas
      // onclone strips all page stylesheets so html2canvas never encounters
      // Tailwind v4's oklch()/lab() color functions it cannot parse.
      // Our container uses only inline hex styles so the output is unaffected.
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 960,
        windowWidth: 960,
        onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
          // Remove every <link> and <style> that Tailwind/Next injects so
          // html2canvas never tries to parse oklch() / lab() color values.
          _clonedDoc.querySelectorAll("link[rel='stylesheet'], style").forEach((el) => el.remove());
          // Ensure the cloned root is also white
          clonedEl.style.background = "#ffffff";
        },
      });

      document.body.removeChild(container);

      // 5. Build multi-page PDF with jsPDF
      // We slice the canvas pixel-by-pixel per A4 page so content isn't cut.
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20; // px in jsPDF "px" unit
      const usableW = pageW - margin * 2;

      // Scale factor: how many canvas pixels per jsPDF px
      const scale = canvas.width / usableW;
      const usablePageH = pageH - margin * 2;
      const pageHeightInCanvasPx = usablePageH * scale;

      let yCanvasPx = 0;
      while (yCanvasPx < canvas.height) {
        if (yCanvasPx > 0) pdf.addPage();

        const sliceH = Math.min(pageHeightInCanvasPx, canvas.height - yCanvasPx);

        // Crop just this slice from the canvas
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, -yCanvasPx);

        const sliceImg = sliceCanvas.toDataURL("image/png", 1.0);
        const sliceHInPdf = sliceH / scale;
        pdf.addImage(sliceImg, "PNG", margin, margin, usableW, sliceHInPdf);

        yCanvasPx += sliceH;
      }

      // 6. Download
      const fromStr = from.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
      const toStr = to.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
      pdf.save(`Weekly-Stock-Report_${fromStr}_to_${toStr}.pdf`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate PDF";
      setPdfError(msg);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Hidden PDF render target */}
      <div ref={pdfContentRef} className="hidden" aria-hidden />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Fire Protection ERP Reports & Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive financial audit, budget variance, expense analysis & engineering project breakdown.
            </p>
          </div>

          {/* Weekly Report PDF Download */}
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <button
              id="btn-download-weekly-report-pdf"
              onClick={handleDownloadWeeklyPDF}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-700 hover:bg-red-800 active:bg-red-900 text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {pdfLoading ? "Generating PDF…" : "Download Weekly Report"}
            </button>
            {pdfError && (
              <p className="text-xs text-red-600 dark:text-red-400 max-w-xs text-right">
                {pdfError}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Inventory report for this week as PDF
            </p>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Portfolio Budget</span>
            <div className="text-xl font-bold text-blue-950 dark:text-blue-100 mt-1">{formatCurrency(totalEstimatedOverall)}</div>
          </div>

          <div className="p-4 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Total Portfolio Expenses</span>
            <div className="text-xl font-bold text-red-950 dark:text-red-100 mt-1">{formatCurrency(totalActualOverall)}</div>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Portfolio Net Variance</span>
            <div className={`text-xl font-bold mt-1 ${totalVarianceOverall >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>
              {formatCurrency(totalVarianceOverall)}
            </div>
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      {(() => {
        const reportTabs: TabItem<ReportTabType>[] = [
          { id: "cost-summary", label: "Project Cost Summary", icon: "📊", count: costSummaryReport.length, category: "financial" },
          { id: "material", label: "Material Cost Report", icon: "📦", count: costSummaryReport.length, category: "costs" },
          { id: "transport", label: "Transport Cost Report", icon: "🚚", count: transportReport.length, category: "costs" },
          { id: "labour", label: "Labour Cost Report", icon: "👷", count: costSummaryReport.length, category: "costs" },
          { id: "expense-analysis", label: "Expense Analysis", icon: "💵", count: categoryExpenseReport.length, category: "financial" },
          { id: "budget-vs-actual", label: "Budget vs Actual", icon: "📉", count: costSummaryReport.length, category: "financial" },
          { id: "profit-loss", label: "Profit / Loss Ranking", icon: "🏆", count: costSummaryReport.length, category: "financial" },
          { id: "engineers", label: "Engineer-wise Projects", icon: "👥", count: engineerReport.length, category: "breakdown" },
          { id: "customers", label: "Customer-wise Projects", icon: "🏢", count: customerReport.length, category: "breakdown" },
          { id: "transfers", label: "Project Transfer History", icon: "🔄", count: transferReport.length, category: "breakdown" },
        ];

        return (
          <ScrollableTabs<ReportTabType>
            tabs={reportTabs}
            categories={[
              { id: "financial", label: "Financial & Audit" },
              { id: "costs", label: "Cost Reports" },
              { id: "breakdown", label: "Entities & History" },
            ]}
            activeTab={activeReport}
            onTabChange={(tabId) => setActiveReport(tabId)}
          />
        );
      })()}

      {/* REPORT CONTENT AREA */}

      {/* REPORT 1: PROJECT COST SUMMARY */}
      {activeReport === "cost-summary" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Project Cost Summary Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Lead Engineer</th>
                  <th className="px-4 py-3 text-right">Project Value</th>
                  <th className="px-4 py-3 text-right">Estimated Cost</th>
                  <th className="px-4 py-3 text-right">Actual Cost</th>
                  <th className="px-4 py-3 text-right">Estimated Profit</th>
                  <th className="px-4 py-3 text-right">Actual Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">
                      <Link href={`/projects/${r.id}`} className="hover:underline hover:text-red-600">
                        {r.projectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-700 dark:text-gray-300">{r.leadEngineer}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-indigo-950 dark:text-indigo-200">{formatCurrency(r.projectValue || 0)}</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(r.estimatedTotalCost || 0)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(r.actualTotalCost || 0)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${(r.estimatedProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(r.estimatedProfit || 0)}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold ${(r.actualProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(r.actualProfit || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: MATERIAL COST REPORT */}
      {activeReport === "material" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Material Cost Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Est. Material Cost</th>
                  <th className="px-4 py-3 text-right">Actual FIFO Material Issue Cost</th>
                  <th className="px-4 py-3 text-right">Material Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName}</td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-teal-600 dark:text-teal-400">{formatCurrency(r.actualTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold">{formatCurrency(r.costVariance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: TRANSPORT COST REPORT */}
      {activeReport === "transport" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Transport Cost Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Transport #</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Vehicle #</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Dispatch Date</th>
                  <th className="px-4 py-3 text-right">Fuel Cost</th>
                  <th className="px-4 py-3 text-right">Vehicle Hire</th>
                  <th className="px-4 py-3 text-right">Loading/Unloading</th>
                  <th className="px-4 py-3 text-right">Total Transport Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {transportReport.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{t.transportNo}</td>
                    <td className="px-4 py-3.5 font-medium">{t.project?.projectName} ({t.project?.projectCode})</td>
                    <td className="px-4 py-3.5 font-semibold">{t.vehicleNumber}</td>
                    <td className="px-4 py-3.5">{t.driverName}</td>
                    <td className="px-4 py-3.5">{formatDate(t.transportDate)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(t.fuelCost)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(t.vehicleHireCost)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(t.loadingCost + t.unloadingCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(t.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: LABOUR COST REPORT */}
      {activeReport === "labour" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Labour Expenses Report</h3>
          <p className="text-xs text-gray-500">Project-wise Labour costs logged via the expense ledger.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Est. Labour Cost</th>
                  <th className="px-4 py-3 text-right">Actual Labour Expense</th>
                  <th className="px-4 py-3 text-right">Labour Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName}</td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">{formatCurrency(r.actualTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold">{formatCurrency(r.costVariance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: EXPENSE ANALYSIS */}
      {activeReport === "expense-analysis" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Expense Analysis by Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryExpenseReport.map((cat) => (
              <div key={cat.expenseType} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{cat.expenseType}</span>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(cat.totalAmount)}</div>
                <div className="text-xs text-gray-400">{cat.count} total ledger entry(ies)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT 6: BUDGET VS ACTUAL */}
      {activeReport === "budget-vs-actual" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Budget vs Actual Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3 text-right">Est. Budget</th>
                  <th className="px-4 py-3 text-right">Actual Expenses</th>
                  <th className="px-4 py-3 text-right">Variance (Remaining)</th>
                  <th className="px-4 py-3">Budget Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600">{formatCurrency(r.actualTotalCost)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${r.budgetBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(r.budgetBalance)}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.budgetBalance >= 0 ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-green-100 text-green-800 rounded-full">
                          UNDER BUDGET
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-red-100 text-red-800 rounded-full">
                          OVER BUDGET 🚨
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 7: PROJECT PROFIT / LOSS */}
      {activeReport === "profit-loss" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Project Profitability Ranking</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Contract Value</th>
                  <th className="px-4 py-3 text-right">Actual Cost</th>
                  <th className="px-4 py-3 text-right">Net Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-bold">#{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName} ({r.projectCode})</td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.actualTotalCost)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${r.profitOrLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(r.profitOrLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 8: ENGINEER-WISE PROJECTS */}
      {activeReport === "engineers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Engineer-wise Projects Allocation Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Engineer Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Total Projects Assigned</th>
                  <th className="px-4 py-3 text-center">Lead Projects</th>
                  <th className="px-4 py-3 text-center">Active Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {engineerReport.map((eng) => (
                  <tr key={eng.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{eng.name}</td>
                    <td className="px-4 py-3.5 text-gray-500">{eng.email}</td>
                    <td className="px-4 py-3.5 font-semibold">{eng.role}</td>
                    <td className="px-4 py-3.5 text-center font-bold">{eng.totalProjectsAssigned}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-amber-600">⭐ {eng.leadProjectsCount}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-600">{eng.activeProjectsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 9: CUSTOMER-WISE PROJECTS */}
      {activeReport === "customers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Customer-wise Projects Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer Company</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-center">Total Projects</th>
                  <th className="px-4 py-3 text-center">Active Projects</th>
                  <th className="px-4 py-3 text-right">Total Portfolio Budget</th>
                  <th className="px-4 py-3 text-right">Total Actual Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {customerReport.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{c.companyName}</td>
                    <td className="px-4 py-3.5">{c.contactPerson || "N/A"}</td>
                    <td className="px-4 py-3.5 text-gray-500">{c.phone || "N/A"}</td>
                    <td className="px-4 py-3.5 text-center font-bold">{c.totalProjects}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-600">{c.activeProjects}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(c.totalEstimatedBudget)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600">{formatCurrency(c.totalActualExpense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 10: PROJECT TRANSFER HISTORY */}
      {activeReport === "transfers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Project-to-Project Transfer History & Cost Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Transfer No</th>
                  <th className="px-4 py-3">From Project</th>
                  <th className="px-4 py-3">To Project</th>
                  <th className="px-4 py-3">Transfer Date</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3 text-right">Transfer Value</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!transferReport || transferReport.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500">
                      No project transfers recorded yet.
                    </td>
                  </tr>
                ) : (
                  transferReport.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">
                        {t.transferNo}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{t.fromProject?.projectCode} — {t.fromProject?.projectName}</td>
                      <td className="px-4 py-3.5 font-medium text-emerald-600 dark:text-emerald-400">{t.toProject?.projectCode} — {t.toProject?.projectName}</td>
                      <td className="px-4 py-3.5">{formatDate(t.transferDate)}</td>
                      <td className="px-4 py-3.5 font-bold">{(t.items || []).length} Item(s)</td>
                      <td className="px-4 py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(t.totalValue || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{t.requestedBy?.name || "System"}</td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsClientPage;
