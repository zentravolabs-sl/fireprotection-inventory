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
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1000,
        onclone: (clonedDoc: Document) => {
          const clonedRef = clonedDoc.querySelector("[data-pdf-content='true']") as HTMLElement;
          if (clonedRef) {
            // STEP 1: Format main paper container
            clonedRef.style.width = "794px";
            clonedRef.style.padding = "32px";
            clonedRef.style.backgroundColor = "#ffffff";
            clonedRef.style.color = "#111827";

            // STEP 2: Force outer border box
            const outerBox = clonedRef.querySelector("div[style*='2px solid']") as HTMLElement || clonedRef.firstElementChild as HTMLElement;
            if (outerBox) {
              outerBox.style.border = "2px solid #1f2937";
              outerBox.style.padding = "24px";
              outerBox.style.boxSizing = "border-box";
            }

            // STEP 3: Force red company title
            const h1 = clonedRef.querySelector("h1");
            if (h1) {
              h1.style.color = "#dc2626";
              h1.style.fontWeight = "900";
              h1.style.textAlign = "center";
              h1.style.lineHeight = "1.2";
              h1.style.margin = "0 0 4px 0";
            }

            // STEP 4: Decorate ALL tables, rows, headers, and cells explicitly with borders, colors, and symmetric padding
            const tables = clonedRef.querySelectorAll("table");
            tables.forEach((tbl) => {
              const tableEl = tbl as HTMLElement;
              tableEl.style.borderCollapse = "collapse";
              tableEl.style.width = "100%";
              tableEl.style.border = "1px solid #1f2937";

              const rows = tbl.querySelectorAll("tr");
              rows.forEach((row, rowIdx) => {
                const rowEl = row as HTMLElement;
                rowEl.style.height = "auto";

                if (rowIdx < rows.length - 1) {
                  rowEl.style.borderBottom = "1px solid #1f2937";
                }

                const cells = row.querySelectorAll("th, td");
                cells.forEach((cell, cellIdx) => {
                  const cellEl = cell as HTMLElement;
                  
                  // Add right border to all cells except last column
                  if (cellIdx < cells.length - 1 && !cellEl.getAttribute("colspan")) {
                    cellEl.style.borderRight = "1px solid #1f2937";
                  }

                  // Force bottom border on cell level
                  cellEl.style.borderBottom = "1px solid #1f2937";
                  
                  // Symmetric padding & centering for html2canvas
                  cellEl.style.paddingTop = "7px";
                  cellEl.style.paddingBottom = "7px";
                  cellEl.style.paddingLeft = "10px";
                  cellEl.style.paddingRight = "10px";
                  cellEl.style.lineHeight = "1.3";
                  cellEl.style.verticalAlign = "middle";
                  cellEl.style.height = "auto";
                  cellEl.style.boxSizing = "border-box";

                  // Gray headers & labels
                  if (cellEl.tagName.toLowerCase() === "th" || cellEl.classList.contains("bg-gray-100") || cellEl.style.backgroundColor) {
                    cellEl.style.backgroundColor = "#f3f4f6";
                  }
                });
              });
            });

            // Force signature labels to sit clearly above table top border line with zero overlap
            const sigLabels = clonedRef.querySelectorAll(".signature-label");
            sigLabels.forEach((lbl) => {
              const el = lbl as HTMLElement;
              el.style.display = "block";
              el.style.marginTop = "10px";
              el.style.marginBottom = "6px";
              el.style.fontWeight = "700";
              el.style.color = "#111827";
              el.style.fontSize = "12px";
              el.style.lineHeight = "1.4";
            });

            // Seal box vertical centering
            const sealCells = clonedRef.querySelectorAll("td[rowspan]");
            sealCells.forEach((sc) => {
              const el = sc as HTMLElement;
              el.style.paddingTop = "20px";
              el.style.paddingBottom = "20px";
              el.style.verticalAlign = "middle";
              el.style.textAlign = "center";
            });

            // STEP 5: Force transport container borders & padding
            const transportBox = clonedRef.querySelector("div[style*='display: flex']") as HTMLElement;
            if (transportBox) {
              transportBox.style.border = "1px solid #1f2937";
              const labelDiv = transportBox.firstElementChild as HTMLElement;
              if (labelDiv) {
                labelDiv.style.borderRight = "1px solid #1f2937";
                labelDiv.style.backgroundColor = "#f3f4f6";
                labelDiv.style.paddingTop = "7px";
                labelDiv.style.paddingBottom = "7px";
                labelDiv.style.paddingLeft = "10px";
                labelDiv.style.paddingRight = "10px";
              }
              const valDiv = transportBox.lastElementChild as HTMLElement;
              if (valDiv) {
                valDiv.style.paddingTop = "7px";
                valDiv.style.paddingBottom = "7px";
                valDiv.style.paddingLeft = "14px";
              }
            }

            // STEP 6: Clean up input elements and reveal hidden spans
            const inputs = clonedRef.querySelectorAll("input");
            inputs.forEach((input) => input.remove());

            const hiddenSpans = clonedRef.querySelectorAll("span.hidden");
            hiddenSpans.forEach((s) => ((s as HTMLElement).style.display = "inline"));
          }

          // STEP 7: Strip style & link tags so lab()/oklch() NEVER crashes html2canvas
          const styles = clonedDoc.querySelectorAll("style, link[rel='stylesheet']");
          styles.forEach((s) => s.remove());

          // STEP 8: Inject clean reset stylesheet
          const baseStyle = clonedDoc.createElement("style");
          baseStyle.innerHTML = `
            * { box-sizing: border-box; text-decoration: none !important; }
            body { background: #ffffff !important; color: #000000 !important; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; border-spacing: 0; }
            td, th { vertical-align: middle !important; }
          `;
          clonedDoc.head.appendChild(baseStyle);
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 200mm x 287mm fill - outer border sits cleanly with uniform 5mm margin around full A4 sheet
      pdf.addImage(imgData, "PNG", 5, 5, 200, 287);
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
          className="mx-auto bg-white text-gray-900 p-8 shadow-lg w-[794px] font-sans text-xs box-border"
          style={{ width: "794px", backgroundColor: "#ffffff", color: "#111827", padding: "32px", boxSizing: "border-box" }}
        >
          <div
            className="border-2 border-gray-800 p-6 space-y-5 box-border"
            style={{ border: "2px solid #1f2937", padding: "24px", boxSizing: "border-box" }}
          >
            {/* Header */}
            <div className="text-center space-y-1" style={{ textAlign: "center", marginBottom: "14px" }}>
              <h1
                className="text-2xl font-black text-red-600 tracking-wide uppercase"
                style={{ color: "#dc2626", fontSize: "22px", fontWeight: 900, textTransform: "uppercase", textAlign: "center", margin: 0, lineHeight: "1.2" }}
              >
                CDN ENGINEERS PVT LTD
              </h1>
              <h2
                className="text-sm font-bold text-gray-900 tracking-wider uppercase underline pt-0.5"
                style={{ color: "#111827", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", textDecoration: "underline", textAlign: "center", marginTop: "4px", lineHeight: "1.2" }}
              >
                {docType === "delivery" ? "MATERIAL DELIVERY NOTE" : "MATERIAL ISSUE NOTE"}
              </h2>
            </div>

            {/* Info Table */}
            <div className="border border-gray-800" style={{ border: "1px solid #1f2937", marginBottom: "14px" }}>
              <table className="w-full text-xs text-left border-collapse" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    <tr key={label} style={{ borderBottom: i < arr.length - 1 ? "1px solid #1f2937" : "none" }}>
                      <td
                        className="w-1/3 px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800"
                        style={{ width: "33%", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#f3f4f6", borderRight: "1px solid #1f2937", color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}
                      >
                        {label}
                      </td>
                      <td className="px-3 py-1.5 font-medium" style={{ padding: "6px 10px", fontWeight: 500, color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 1: Items */}
            <div className="space-y-1.5" style={{ marginBottom: "14px" }}>
              <h3 className="font-bold text-xs text-gray-900" style={{ fontWeight: "bold", fontSize: "12px", color: "#111827", margin: "0 0 6px 0" }}>
                1. {docType === "delivery" ? "Delivery Details" : "Issue Details"}
              </h3>
              <table className="w-full text-xs text-left border-collapse border border-gray-800" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #1f2937" }}>
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800 text-gray-900 font-bold" style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #1f2937" }}>
                    <th className="px-2 py-1.5 border-r border-gray-800 text-center" style={{ padding: "7px 4px", borderRight: "1px solid #1f2937", textAlign: "center", width: "50px", whiteSpace: "nowrap", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Item No.</th>
                    <th className="px-3 py-1.5 border-r border-gray-800 text-left" style={{ padding: "7px 10px", borderRight: "1px solid #1f2937", textAlign: "left", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Description of Material</th>
                    <th className="px-2 py-1.5 border-r border-gray-800 text-center" style={{ padding: "7px 4px", borderRight: "1px solid #1f2937", textAlign: "center", width: "48px", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Unit</th>
                    <th className="px-2 py-1.5 border-r border-gray-800 text-center" style={{ padding: "7px 4px", borderRight: "1px solid #1f2937", textAlign: "center", width: "58px", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Quantity</th>
                    {docType === "issue" && (
                      <>
                        <th className="px-2.5 py-1.5 border-r border-gray-800 text-right" style={{ padding: "7px 6px", borderRight: "1px solid #1f2937", textAlign: "right", width: "78px", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Unit Price</th>
                        <th className="px-2.5 py-1.5 border-r border-gray-800 text-right" style={{ padding: "7px 6px", borderRight: "1px solid #1f2937", textAlign: "right", width: "88px", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Total Price</th>
                      </>
                    )}
                    <th className="px-3 py-1.5 text-left" style={{ padding: "7px 10px", textAlign: "left", width: "90px", fontWeight: "bold", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Actual items */}
                  {deliveryLineItems.map((item, idx) => {
                    const rowTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid #1f2937" }}>
                        <td className="px-2.5 py-1.5 border-r border-gray-800 text-center font-medium" style={{ padding: "6px 6px", borderRight: "1px solid #1f2937", textAlign: "center", fontWeight: 500, color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="px-3 py-1.5 border-r border-gray-800 text-left font-medium" style={{ padding: "6px 10px", borderRight: "1px solid #1f2937", textAlign: "left", fontWeight: 500, color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                          {item.description}
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-gray-800 text-center" style={{ padding: "6px 6px", borderRight: "1px solid #1f2937", textAlign: "center", color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                          {item.unit}
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-gray-800 text-center font-bold" style={{ padding: "6px 6px", borderRight: "1px solid #1f2937", textAlign: "center", fontWeight: "bold", color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                          {item.quantity}
                        </td>
                        {docType === "issue" && (
                          <>
                            <td className="px-3 py-1.5 border-r border-gray-800 text-right font-mono" style={{ padding: "6px 10px", borderRight: "1px solid #1f2937", textAlign: "right", fontFamily: "monospace", color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                              <span className="hidden print:inline font-bold">
                                {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  setCustomPrices({ ...customPrices, [item.id]: parseFloat(e.target.value) || 0 })
                                }
                                className="print:hidden w-20 px-1 py-0.5 border border-gray-300 rounded text-right font-mono"
                                style={{ textAlign: "right", width: "80px" }}
                              />
                            </td>
                            <td className="px-3 py-1.5 border-r border-gray-800 text-right font-mono font-bold" style={{ padding: "6px 10px", borderRight: "1px solid #1f2937", textAlign: "right", fontFamily: "monospace", fontWeight: "bold", color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                              {rowTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-1.5 text-left text-gray-600" style={{ padding: "6px 10px", textAlign: "left", color: "#4b5563", verticalAlign: "middle", lineHeight: "1.3" }}>
                          {item.remarks}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Filler rows up to 6 rows total - preserves pre-printed vertical column lines (iri) at all times */}
                  {Array.from({ length: Math.max(0, 6 - deliveryLineItems.length) }).map((_, idx) => {
                    const rowNum = deliveryLineItems.length + idx + 1;
                    return (
                      <tr key={`filler-${idx}`} style={{ borderBottom: "1px solid #1f2937" }}>
                        <td className="px-2.5 py-1.5 border-r border-gray-800 text-center text-gray-400 font-medium" style={{ padding: "6px 6px", borderRight: "1px solid #1f2937", textAlign: "center", color: "#9ca3af", verticalAlign: "middle", lineHeight: "1.3" }}>
                          {String(rowNum).padStart(2, "0")}
                        </td>
                        <td className="px-3 py-1.5 border-r border-gray-800" style={{ padding: "6px 10px", borderRight: "1px solid #1f2937", verticalAlign: "middle" }}>&nbsp;</td>
                        <td className="px-2.5 py-1.5 border-r border-gray-800 text-center" style={{ padding: "6px 6px", borderRight: "1px solid #1f2937", textAlign: "center", verticalAlign: "middle" }}>&nbsp;</td>
                        <td className="px-2.5 py-1.5 border-r border-gray-800 text-center" style={{ padding: "6px 6px", borderRight: "1px solid #1f2937", textAlign: "center", verticalAlign: "middle" }}>&nbsp;</td>
                        {docType === "issue" && (
                          <>
                            <td className="px-3 py-1.5 border-r border-gray-800" style={{ padding: "6px 10px", borderRight: "1px solid #1f2937", verticalAlign: "middle" }}>&nbsp;</td>
                            <td className="px-3 py-1.5 border-r border-gray-800" style={{ padding: "6px 10px", borderRight: "1px solid #1f2937", verticalAlign: "middle" }}>&nbsp;</td>
                          </>
                        )}
                        <td className="px-3 py-1.5" style={{ padding: "6px 10px", verticalAlign: "middle" }}>&nbsp;</td>
                      </tr>
                    );
                  })}

                  {docType === "issue" && deliveryLineItems.length > 0 && (
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-800" style={{ backgroundColor: "#f3f4f6", fontWeight: "bold", borderTop: "2px solid #1f2937" }}>
                      <td colSpan={5} className="px-3 py-1.5 text-right border-r border-gray-800 uppercase" style={{ padding: "7px 10px", borderRight: "1px solid #1f2937", textAlign: "right", textTransform: "uppercase", color: "#111827", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>
                        Grand Total:
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-sm border-r border-gray-800 font-black text-teal-900" style={{ padding: "7px 10px", borderRight: "1px solid #1f2937", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#0f766e", backgroundColor: "#f3f4f6", verticalAlign: "middle", lineHeight: "1.3" }}>
                        {issueNoteGrandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ backgroundColor: "#f3f4f6", verticalAlign: "middle" }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Transport */}
            <div className="space-y-1.5" style={{ marginBottom: "14px" }}>
              <h3 className="font-bold text-xs text-gray-900" style={{ fontWeight: "bold", fontSize: "12px", color: "#111827", margin: "0 0 6px 0" }}>
                2. Transport Details
              </h3>
              <div className="border border-gray-800 flex" style={{ border: "1px solid #1f2937", display: "flex" }}>
                <div className="w-36 px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800" style={{ width: "140px", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#f3f4f6", borderRight: "1px solid #1f2937", color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                  Vehicle No
                </div>
                <div className="px-4 py-1.5 font-semibold font-mono text-gray-900 flex-1" style={{ padding: "6px 14px", fontWeight: 600, fontFamily: "monospace", flex: 1, color: "#111827", verticalAlign: "middle", lineHeight: "1.3" }}>
                  {vehicleNo || "..........................................................."}
                </div>
              </div>
            </div>

            {/* Section 3: Confirmation */}
            <div className="space-y-3" style={{ marginBottom: "14px" }}>
              <h3 className="font-bold text-xs text-gray-900" style={{ fontWeight: "bold", fontSize: "12px", color: "#111827", margin: "0 0 10px 0" }}>
                3. Confirmation
              </h3>
              
              {/* Delivered By Table */}
              <div style={{ marginBottom: "12px" }}>
                <p className="font-semibold text-xs text-gray-900 signature-label" style={{ fontWeight: 700, fontSize: "12px", color: "#111827", margin: "0 0 6px 0", lineHeight: "1.4", display: "block" }}>
                  Delivered By:
                </p>
                <table className="w-full text-xs border-collapse border border-gray-800" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #1f2937" }}>
                  <tbody>
                    <tr>
                      <td className="w-1/3 border-r border-gray-800" style={{ width: "33.33%", padding: "10px 12px", borderRight: "1px solid #1f2937", color: "#111827", verticalAlign: "middle", lineHeight: "1.4" }}>
                        <strong>Name:</strong> {deliveredBy}
                      </td>
                      <td className="w-1/3 border-r border-gray-800" style={{ width: "33.33%", padding: "10px 12px", borderRight: "1px solid #1f2937", color: "#111827", verticalAlign: "middle", lineHeight: "1.4" }}>
                        <strong>Signature:</strong>
                      </td>
                      <td className="w-1/3" style={{ width: "33.33%", padding: "10px 12px", color: "#111827", verticalAlign: "middle", lineHeight: "1.4" }}>
                        <strong>Date:</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Received By & Seal Table */}
              <div>
                <p className="font-semibold text-xs text-gray-900 signature-label" style={{ fontWeight: 700, fontSize: "12px", color: "#111827", margin: "0 0 6px 0", lineHeight: "1.4", display: "block" }}>
                  Received By:
                </p>
                <table className="w-full text-xs border-collapse border border-gray-800" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #1f2937" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #1f2937" }}>
                      <td className="w-1/3 border-r border-gray-800" style={{ width: "33.33%", padding: "10px 12px", borderRight: "1px solid #1f2937", borderBottom: "1px solid #1f2937", verticalAlign: "middle", color: "#111827", lineHeight: "1.4" }}>
                        <strong>Name:</strong> {receivedBy}
                      </td>
                      <td className="w-1/3 border-r border-gray-800" style={{ width: "33.33%", padding: "10px 12px", borderRight: "1px solid #1f2937", borderBottom: "1px solid #1f2937", verticalAlign: "middle", color: "#111827", lineHeight: "1.4" }}>
                        <strong>Signature:</strong>
                      </td>
                      <td
                        rowSpan={2}
                        className="w-1/3 text-center text-gray-400 font-semibold align-middle border-l border-gray-800"
                        style={{ width: "33.33%", padding: "20px 8px", textAlign: "center", verticalAlign: "middle", color: "#9ca3af", fontWeight: 600, borderLeft: "1px solid #1f2937", lineHeight: "1.4" }}
                      >
                        Received Company Seal
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border-r border-gray-800" style={{ padding: "10px 12px", borderRight: "1px solid #1f2937", verticalAlign: "middle", color: "#111827", lineHeight: "1.4" }}>
                        <strong>Date:</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note & Footer Disclaimer */}
            <div className="pt-2 border-t border-gray-400 text-xs space-y-1 text-gray-800" style={{ borderTop: "1px solid #9ca3af", paddingTop: "8px", marginTop: "14px" }}>
              <p className="font-bold" style={{ fontWeight: "bold", color: "#111827", margin: 0 }}>Note:</p>
              <p style={{ margin: "2px 0", color: "#374151" }}>Please check all materials upon delivery.</p>
              <p style={{ margin: "2px 0", color: "#374151" }}>Any discrepancies or damages should be reported immediately.</p>
              <div className="pt-2 border-b border-dashed border-gray-400 w-full" style={{ borderBottom: "1px dashed #9ca3af", width: "100%", paddingTop: "8px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDeliveryAndIssueNotesTab;
