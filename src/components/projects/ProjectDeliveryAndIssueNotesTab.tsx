"use client";

// ============================================================
// src/components/projects/ProjectDeliveryAndIssueNotesTab.tsx
// Delivery Note & Material Issue Note Document Generator with PDF Print & Download
// Matches CDN ENGINEERS PVT LTD official paper format with full color support
// ============================================================

import React, { useState, useMemo, useRef } from "react";
import { formatDate, formatCurrency } from "@/lib/dateUtils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InventoryItem {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
  brand?: string | null;
  defaultSellPrice?: number;
}

interface MaterialRequestItem {
  id: number;
  qtyRequested: number;
  qtyApproved: number;
  qtyIssued: number;
  inventory: InventoryItem;
}

interface MaterialRequest {
  id: number;
  requestNo: string;
  requestDate: string | Date;
  createdAt: string | Date;
  items?: MaterialRequestItem[];
}

interface ProjectMaterial {
  id: number;
  issuedQty: number;
  balanceQty: number;
  createdAt: string | Date;
  inventory: InventoryItem;
  materialIssueItem?: {
    costPrice?: number;
    stockBatch?: {
      unitCost?: number;
      batchNo?: string | null;
    };
  };
}

interface ToolItem {
  id: number;
  toolCode: string;
  name: string;
  serialNo: string;
}

interface ToolAssignmentItem {
  id: number;
  tool: ToolItem;
  returnedAt?: string | Date | null;
}

interface ToolAssignment {
  id: number;
  assignmentNo: string;
  assignDate: string | Date;
  createdAt: string | Date;
  items?: ToolAssignmentItem[];
}

interface ProjectDeliveryAndIssueNotesTabProps {
  project: {
    id: number;
    projectCode: string;
    projectName: string;
    location?: string | null;
    customer?: {
      companyName: string;
      address?: string | null;
      contactPerson?: string | null;
      phone?: string | null;
    } | null;
    projectManager?: { name: string } | null;
    engineers?: Array<{ engineer?: { name: string } }>;
    materialRequests?: MaterialRequest[];
    projectMaterials?: ProjectMaterial[];
  };
  toolAssignments?: ToolAssignment[];
}

export function ProjectDeliveryAndIssueNotesTab({
  project,
  toolAssignments = [],
}: ProjectDeliveryAndIssueNotesTabProps) {
  const [docType, setDocType] = useState<"delivery" | "issue">("delivery");
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "range" | "all">("all");
  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);

  const defaultSeq = String(new Date().getMonth() + 1).padStart(2, "0") + "-01";
  const [docNo, setDocNo] = useState<string>(`DN-${project.projectCode}-${defaultSeq}`);
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [deliveredBy, setDeliveredBy] = useState<string>("");
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  const printRef = useRef<HTMLDivElement>(null);

  const isDateInFilter = (dateVal: string | Date) => {
    if (dateFilterMode === "all") return true;
    const dStr = new Date(dateVal).toISOString().split("T")[0];
    if (dateFilterMode === "today") return dStr === todayStr;
    if (dateFilterMode === "range") return dStr >= fromDate && dStr <= toDate;
    return true;
  };

  const deliveryLineItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "MATERIAL" | "TOOL";
      description: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      remarks: string;
    }> = [];

    if (project.projectMaterials && project.projectMaterials.length > 0) {
      project.projectMaterials.forEach((pm) => {
        if (isDateInFilter(pm.createdAt)) {
          const unitPrice =
            customPrices[`pm-${pm.id}`] ??
            pm.materialIssueItem?.stockBatch?.unitCost ??
            pm.materialIssueItem?.costPrice ??
            pm.inventory.defaultSellPrice ??
            0;
          items.push({
            id: `pm-${pm.id}`,
            type: "MATERIAL",
            description: pm.inventory.name,
            unit: pm.inventory.unit || "Nos",
            quantity: pm.issuedQty || pm.balanceQty || 0,
            unitPrice,
            remarks: "",
          });
        }
      });
    } else if (project.materialRequests && project.materialRequests.length > 0) {
      project.materialRequests.forEach((mr) => {
        if (isDateInFilter(mr.createdAt || mr.requestDate)) {
          mr.items?.forEach((mri) => {
            const qty =
              mri.qtyIssued > 0 ? mri.qtyIssued : mri.qtyApproved > 0 ? mri.qtyApproved : mri.qtyRequested;
            items.push({
              id: `mri-${mri.id}`,
              type: "MATERIAL",
              description: mri.inventory.name,
              unit: mri.inventory.unit || "Nos",
              quantity: qty,
              unitPrice: customPrices[`mri-${mri.id}`] ?? mri.inventory.defaultSellPrice ?? 0,
              remarks: "",
            });
          });
        }
      });
    }

    if (docType === "delivery" && toolAssignments.length > 0) {
      toolAssignments.forEach((ta) => {
        if (isDateInFilter(ta.assignDate || ta.createdAt)) {
          ta.items?.forEach((tai) => {
            items.push({
              id: `tool-${tai.id}`,
              type: "TOOL",
              description: `${tai.tool.name} (S/N: ${tai.tool.serialNo})`,
              unit: "Nos",
              quantity: 1,
              unitPrice: 0,
              remarks: "",
            });
          });
        }
      });
    }

    return items;
  }, [project, toolAssignments, docType, dateFilterMode, fromDate, toDate, customPrices]);

  const issueNoteGrandTotal = useMemo(
    () => deliveryLineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    [deliveryLineItems]
  );

  const [isDownloading, setIsDownloading] = useState(false);

  // ── Print handler with FULL COLOR support ─────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return;

    const styleLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']")
    )
      .map((l) => `<link rel="stylesheet" href="${l.href}">`)
      .join("\n");

    const inlineStyles = Array.from(document.querySelectorAll<HTMLStyleElement>("style"))
      .map((s) => `<style>${s.innerHTML}</style>`)
      .join("\n");

    const noteHTML = printRef.current.outerHTML;

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${styleLinks}
  ${inlineStyles}
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    html, body {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .print\\:hidden { display: none !important; }
    .print\\:inline { display: inline !important; }
    .print\\:block { display: block !important; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>${noteHTML}</body>
</html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    };
  };

  // ── Helper to copy inline styles for canvas rendering ──────────────────────
  const inlineComputedStyles = (src: Element, dst: Element) => {
    if (src.nodeType !== Node.ELEMENT_NODE) return;
    const srcEl = src as HTMLElement;
    const dstEl = dst as HTMLElement;

    try {
      const computed = window.getComputedStyle(srcEl);
      const props = [
        "display",
        "position",
        "top",
        "left",
        "right",
        "bottom",
        "width",
        "min-width",
        "max-width",
        "height",
        "min-height",
        "max-height",
        "flex",
        "flex-direction",
        "flex-grow",
        "flex-shrink",
        "flex-wrap",
        "justify-content",
        "align-items",
        "align-content",
        "gap",
        "row-gap",
        "column-gap",
        "grid-template-columns",
        "grid-template-rows",
        "box-sizing",
        "color",
        "background-color",
        "font-family",
        "font-size",
        "font-weight",
        "line-height",
        "text-align",
        "text-decoration",
        "text-transform",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "border-top-width",
        "border-top-style",
        "border-top-color",
        "border-right-width",
        "border-right-style",
        "border-right-color",
        "border-bottom-width",
        "border-bottom-style",
        "border-bottom-color",
        "border-left-width",
        "border-left-style",
        "border-left-color",
        "border-top-left-radius",
        "border-top-right-radius",
        "border-bottom-left-radius",
        "border-bottom-right-radius",
        "vertical-align",
        "border-collapse",
        "table-layout",
      ];

      for (const prop of props) {
        const val = computed.getPropertyValue(prop);
        if (val && !val.includes("lab(") && !val.includes("oklch(")) {
          dstEl.style.setProperty(prop, val);
        }
      }
    } catch (e) {
      // Ignore
    }

    const srcChildren = Array.from(src.children);
    const dstChildren = Array.from(dst.children);

    for (let i = 0; i < srcChildren.length; i++) {
      if (dstChildren[i]) {
        inlineComputedStyles(srcChildren[i], dstChildren[i]);
      }
    }
  };

  // ── Client-side PDF file download with Pixel-Perfect Colors & Alignments ─────
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const originalRef = printRef.current;

      const canvas = await html2canvas(originalRef, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        windowHeight: 1600,
        onclone: (clonedDoc: Document) => {
          const clonedRef = clonedDoc.querySelector("[data-pdf-content='true']") as HTMLElement;
          if (clonedRef && originalRef) {
            inlineComputedStyles(originalRef, clonedRef);
          }

          // Remove inputs from cloned DOM so box outlines don't render in PDF
          if (clonedRef) {
            const inputs = clonedRef.querySelectorAll("input");
            inputs.forEach((input) => input.remove());

            // Ensure static formatted spans are visible in PDF
            const hiddenSpans = clonedRef.querySelectorAll("span.hidden");
            hiddenSpans.forEach((s) => ((s as HTMLElement).style.display = "inline"));

            // Force explicit colors for key branding & table elements
            const redTitle = clonedRef.querySelector(".text-red-600");
            if (redTitle) (redTitle as HTMLElement).style.color = "#dc2626";

            const tealTotals = clonedRef.querySelectorAll(".text-teal-900, .text-teal-800, .text-teal-600");
            tealTotals.forEach((el) => ((el as HTMLElement).style.color = "#0f766e"));

            const grayHeaders = clonedRef.querySelectorAll(".bg-gray-100");
            grayHeaders.forEach((el) => ((el as HTMLElement).style.backgroundColor = "#f3f4f6"));
          }

          // Strip style tags that contain unsupported lab/oklch parser rules
          const styles = clonedDoc.querySelectorAll("style, link[rel='stylesheet']");
          styles.forEach((s) => s.remove());

          // Inject clean, exact print reset stylesheet
          const baseStyle = clonedDoc.createElement("style");
          baseStyle.innerHTML = `
            * { box-sizing: border-box; }
            body { background: #ffffff !important; color: #000000 !important; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; }
          `;
          clonedDoc.head.appendChild(baseStyle);
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 20) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${docNo || "Document"}.pdf`);
    } catch (err: any) {
      console.error("PDF Download error:", err);
      alert(`PDF Generation failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Controls toolbar ── */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              📜 Document Generator (Delivery &amp; Issue Notes)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select note type, filter by date range, edit document details, print or download PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Note type toggle */}
            <div className="inline-flex rounded-lg p-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setDocType("delivery"); setDocNo(`DN-${project.projectCode}-${defaultSeq}`); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${docType === "delivery" ? "bg-red-600 text-white shadow" : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                  }`}
              >
                🚚 Delivery Note
              </button>
              <button
                onClick={() => { setDocType("issue"); setDocNo(`IN-${project.projectCode}-${defaultSeq}`); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${docType === "issue" ? "bg-teal-600 text-white shadow" : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                  }`}
              >
                📦 Issue Note
              </button>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-2"
            >
              {isDownloading ? "⏳ Generating..." : "📥 Download PDF"}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-2"
            >
              🖨️ Print Document
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div>
            <label className="block text-gray-500 font-medium mb-1">Date Filter</label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md font-medium text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Dates</option>
              <option value="today">Today ({todayStr})</option>
              <option value="range">Custom Range</option>
            </select>
          </div>

          {dateFilterMode === "range" && (
            <>
              <div>
                <label className="block text-gray-500 font-medium mb-1">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100" />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-500 font-medium mb-1">Doc No.</label>
            <input type="text" value={docNo} onChange={(e) => setDocNo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 font-mono" />
          </div>
          <div>
            <label className="block text-gray-500 font-medium mb-1">Date</label>
            <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-gray-500 font-medium mb-1">Vehicle No.</label>
            <input type="text" placeholder="e.g. WP CBB-4512" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-gray-500 font-medium mb-1">Delivered By</label>
            <input type="text" value={deliveredBy} onChange={(e) => setDeliveredBy(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-gray-500 font-medium mb-1">Received By</label>
            <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100" />
          </div>
        </div>
      </div>

      {/* ── Document preview paper ── */}
      <div className="bg-gray-100 dark:bg-gray-950 p-2 sm:p-6 rounded-xl overflow-x-auto">
        <div
          ref={printRef}
          data-pdf-content="true"
          className="mx-auto bg-white text-gray-900 p-8 shadow-lg w-[794px] min-h-[1123px] flex flex-col justify-between border border-gray-300 font-sans text-xs box-border"
        >
          <div className="border-2 border-gray-800 p-6 flex-1 flex flex-col justify-between space-y-6 box-border">
            {/* TOP SECTION: Header, Info Table, Delivery/Issue Details, Transport */}
            <div className="space-y-5">
              {/* Header with explicit spacing */}
              <div className="text-center py-1 space-y-1">
                <h1 className="text-2xl font-black text-red-600 tracking-wide uppercase">
                  CDN ENGINEERS PVT LTD
                </h1>
                <h2 className="text-sm font-bold text-gray-900 tracking-wider uppercase underline decoration-1 pt-0.5">
                  {docType === "delivery" ? "MATERIAL DELIVERY NOTE" : "MATERIAL ISSUE NOTE"}
                </h2>
              </div>

              {/* Info table */}
              <div className="border border-gray-800">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    {[
                      ["Company Name", project.customer?.companyName || "N/A"],
                      ["Address", project.customer?.address || project.location || "N/A"],
                      ["Contact Number", `${project.customer?.phone || "N/A"}${project.customer?.contactPerson ? ` (${project.customer.contactPerson})` : ""}`],
                      [docType === "delivery" ? "Delivery Note No." : "Issue Note No.", docNo],
                      ["Date", formatDate(docDate)],
                      ["Project Name / Site", `${project.projectName} (${project.projectCode})`],
                      ["Site Address", project.location || project.customer?.address || "N/A"],
                    ].map(([label, value], i, arr) => (
                      <tr key={label} className={i < arr.length - 1 ? "border-b border-gray-800" : ""}>
                        <td className="w-1/3 px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">{label}</td>
                        <td className="px-3 py-1.5 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 1: Items */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-gray-900">
                  1. {docType === "delivery" ? "Delivery Details" : "Issue Details"}
                </h3>
                <table className="w-full text-xs text-left border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-800 text-gray-900 font-bold">
                      <th className="px-2.5 py-1.5 border-r border-gray-800 text-center w-12">Item No.</th>
                      <th className="px-3 py-1.5 border-r border-gray-800">Description of Material</th>
                      <th className="px-2.5 py-1.5 border-r border-gray-800 text-center w-16">Unit</th>
                      <th className="px-2.5 py-1.5 border-r border-gray-800 text-center w-20">Quantity</th>
                      {docType === "issue" && (
                        <>
                          <th className="px-3 py-1.5 border-r border-gray-800 text-right w-28">Unit Price (LKR)</th>
                          <th className="px-3 py-1.5 border-r border-gray-800 text-right w-32">Total Price (LKR)</th>
                        </>
                      )}
                      <th className="px-3 py-1.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {deliveryLineItems.length === 0 ? (
                      <tr>
                        <td colSpan={docType === "issue" ? 7 : 5} className="text-center py-6 text-gray-500">
                          No items found for the selected date filter.
                        </td>
                      </tr>
                    ) : (
                      deliveryLineItems.map((item, idx) => {
                        const rowTotal = item.quantity * item.unitPrice;
                        return (
                          <tr key={item.id} className="border-b border-gray-800">
                            <td className="px-2.5 py-2 border-r border-gray-800 text-center font-medium">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="px-3 py-2 border-r border-gray-800 font-medium">{item.description}</td>
                            <td className="px-2.5 py-2 border-r border-gray-800 text-center">{item.unit}</td>
                            <td className="px-2.5 py-2 border-r border-gray-800 text-center font-bold">{item.quantity}</td>
                            {docType === "issue" && (
                              <>
                                <td className="px-3 py-2 border-r border-gray-800 text-right font-mono">
                                  {/* Print & PDF static formatted value */}
                                  <span className="hidden print:inline font-bold">{formatCurrency(item.unitPrice)}</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      setCustomPrices({ ...customPrices, [item.id]: parseFloat(e.target.value) || 0 })
                                    }
                                    className="print:hidden w-20 px-1 py-0.5 border border-gray-300 rounded text-right font-mono"
                                  />
                                </td>
                                <td className="px-3 py-2 border-r border-gray-800 text-right font-mono font-bold">
                                  {formatCurrency(rowTotal)}
                                </td>
                              </>
                            )}
                            <td className="px-3 py-2 text-gray-600">{item.remarks}</td>
                          </tr>
                        );
                      })
                    )}
                    {/* Minimum rows filler so table maintains a clean pre-printed document feel */}
                    {deliveryLineItems.length > 0 && deliveryLineItems.length < 5 && (
                      Array.from({ length: 5 - deliveryLineItems.length }).map((_, idx) => (
                        <tr key={`filler-${idx}`} className="border-b border-gray-800 h-8">
                          <td className="px-2.5 py-1.5 border-r border-gray-800 text-center text-gray-400 font-medium">
                            {String(deliveryLineItems.length + idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-1.5 border-r border-gray-800">&nbsp;</td>
                          <td className="px-2.5 py-1.5 border-r border-gray-800">&nbsp;</td>
                          <td className="px-2.5 py-1.5 border-r border-gray-800">&nbsp;</td>
                          {docType === "issue" && (
                            <>
                              <td className="px-3 py-1.5 border-r border-gray-800">&nbsp;</td>
                              <td className="px-3 py-1.5 border-r border-gray-800">&nbsp;</td>
                            </>
                          )}
                          <td className="px-3 py-1.5">&nbsp;</td>
                        </tr>
                      ))
                    )}
                    {docType === "issue" && deliveryLineItems.length > 0 && (
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
                        <td colSpan={5} className="px-3 py-2 text-right border-r border-gray-800 uppercase">
                          Grand Total (LKR):
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm border-r border-gray-800 font-black text-teal-900">
                          {formatCurrency(issueNoteGrandTotal)}
                        </td>
                        <td />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 2: Transport */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-xs text-gray-900">2. Transport Details</h3>
                <div className="border border-gray-800 flex">
                  <div className="w-36 px-3 py-2 font-bold bg-gray-100 border-r border-gray-800">Vehicle No</div>
                  <div className="px-4 py-2 font-semibold font-mono text-gray-900 flex-1">
                    {vehicleNo || "..........................................................."}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Confirmation tables & Disclaimer notes */}
            <div className="space-y-4 pt-2">
              {/* Section 3: Confirmation */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-gray-900">3. Confirmation</h3>
                
                {/* Delivered By Table */}
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-gray-900">Delivered By:</p>
                  <table className="w-full text-xs border-collapse border border-gray-800">
                    <tbody>
                      <tr>
                        <td className="w-1/3 px-3 py-2.5 border-r border-gray-800">
                          <strong>Name:</strong> {deliveredBy}
                        </td>
                        <td className="w-1/3 px-3 py-2.5 border-r border-gray-800">
                          <strong>Signature:</strong>
                        </td>
                        <td className="w-1/3 px-3 py-2.5">
                          <strong>Date:</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Received By & Seal Table */}
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-gray-900">Received By:</p>
                  <table className="w-full text-xs border-collapse border border-gray-800">
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="w-1/3 px-3 py-2.5 border-r border-gray-800 align-top">
                          <strong>Name:</strong> {receivedBy}
                        </td>
                        <td className="w-1/3 px-3 py-2.5 border-r border-gray-800 align-top">
                          <strong>Signature:</strong>
                        </td>
                        <td
                          rowSpan={2}
                          className="w-1/3 p-3 text-center text-gray-400 font-semibold align-middle border-l border-gray-800"
                        >
                          Received Company Seal
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="px-3 py-2.5 border-r border-gray-800 align-top">
                          <strong>Date:</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note & Footer Disclaimer */}
              <div className="pt-2 border-t border-gray-400 text-xs space-y-1 text-gray-800">
                <p className="font-bold">Note:</p>
                <p>Please check all materials upon delivery.</p>
                <p>Any discrepancies or damages should be reported immediately.</p>
                <div className="pt-3 border-b border-dashed border-gray-400 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDeliveryAndIssueNotesTab;
