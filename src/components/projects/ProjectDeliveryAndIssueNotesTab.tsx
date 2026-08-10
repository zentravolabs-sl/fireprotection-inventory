"use client";

// ============================================================
// src/components/projects/ProjectDeliveryAndIssueNotesTab.tsx
// Delivery Note & Material Issue Note Document Generator with PDF Print
// Matches CDN ENGINEERS PVT LTD official paper format
// ============================================================

import React, { useState, useMemo, useRef } from "react";
import { formatDate, formatCurrency } from "@/lib/dateUtils";

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
    projectManager?: {
      name: string;
    } | null;
    engineers?: Array<{
      engineer?: {
        name: string;
      };
    }>;
    materialRequests?: MaterialRequest[];
    projectMaterials?: ProjectMaterial[];
  };
  toolAssignments?: ToolAssignment[];
}

export function ProjectDeliveryAndIssueNotesTab({
  project,
  toolAssignments = [],
}: ProjectDeliveryAndIssueNotesTabProps) {
  // Document mode
  const [docType, setDocType] = useState<"delivery" | "issue">("delivery");

  // Date Filter State
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "range" | "all">("all");
  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);

  // Document Headers & Details (Editable)
  const defaultSeq = String(new Date().getMonth() + 1).padStart(2, "0") + "-01";
  const [docNo, setDocNo] = useState<string>(`DN-${project.projectCode}-${defaultSeq}`);
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [deliveredBy, setDeliveredBy] = useState<string>("");
  const [receivedBy, setReceivedBy] = useState<string>("");

  // Custom Editable Prices state for Issue Note items: key = `mat-${id}`
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  const printRef = useRef<HTMLDivElement>(null);

  // Helper date check
  const isDateInFilter = (dateVal: string | Date) => {
    if (dateFilterMode === "all") return true;
    const d = new Date(dateVal);
    const dStr = d.toISOString().split("T")[0];

    if (dateFilterMode === "today") {
      return dStr === todayStr;
    }

    if (dateFilterMode === "range") {
      return dStr >= fromDate && dStr <= toDate;
    }

    return true;
  };

  // Compile line items based on docType and date filter
  const deliveryLineItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "MATERIAL" | "TOOL";
      code: string;
      description: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      remarks: string;
    }> = [];

    // 1. Materials from ProjectMaterials or MaterialRequests
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
            code: pm.inventory.itemCode,
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
            const unitPrice =
              customPrices[`mri-${mri.id}`] ?? mri.inventory.defaultSellPrice ?? 0;
            const qty = mri.qtyIssued > 0 ? mri.qtyIssued : mri.qtyApproved > 0 ? mri.qtyApproved : mri.qtyRequested;

            items.push({
              id: `mri-${mri.id}`,
              type: "MATERIAL",
              code: mri.inventory.itemCode,
              description: mri.inventory.name,
              unit: mri.inventory.unit || "Nos",
              quantity: qty,
              unitPrice,
              remarks: "",
            });
          });
        }
      });
    }

    // 2. Tools (Included ONLY in Delivery Note)
    if (docType === "delivery" && toolAssignments && toolAssignments.length > 0) {
      toolAssignments.forEach((ta) => {
        if (isDateInFilter(ta.assignDate || ta.createdAt)) {
          ta.items?.forEach((tai) => {
            items.push({
              id: `tool-${tai.id}`,
              type: "TOOL",
              code: tai.tool.toolCode,
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

  // Compute Grand Total for Issue Note
  const issueNoteGrandTotal = useMemo(() => {
    return deliveryLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [deliveryLineItems]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Filter Toolbar (Hidden when printing) */}
      <div className="print:hidden bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              📜 Document Generator (Delivery & Issue Notes)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select note type, filter by date range, edit document details, and print/download clean PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Note Type Selector */}
            <div className="inline-flex rounded-lg p-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setDocType("delivery");
                  setDocNo(`DN-${project.projectCode}-${defaultSeq}`);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  docType === "delivery"
                    ? "bg-red-600 text-white shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                🚚 Delivery Note (Materials + Tools)
              </button>

              <button
                onClick={() => {
                  setDocType("issue");
                  setDocNo(`IN-${project.projectCode}-${defaultSeq}`);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  docType === "issue"
                    ? "bg-teal-600 text-white shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                📦 Material Issue Note (With Prices)
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-2"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Date Filter & Form Inputs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          {/* Date Mode */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Date Filter</label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md font-medium text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Dates</option>
              <option value="today">Today ({todayStr})</option>
              <option value="range">Custom Date Range</option>
            </select>
          </div>

          {/* From Date */}
          {dateFilterMode === "range" && (
            <div>
              <label className="block text-gray-500 font-medium mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {/* To Date */}
          {dateFilterMode === "range" && (
            <div>
              <label className="block text-gray-500 font-medium mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {/* Document No */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Doc No.</label>
            <input
              type="text"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 font-mono"
            />
          </div>

          {/* Vehicle No */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Vehicle No.</label>
            <input
              type="text"
              placeholder="e.g. WP CBB-4512"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Delivered By */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Delivered By</label>
            <input
              type="text"
              value={deliveredBy}
              onChange={(e) => setDeliveredBy(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Received By */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">Received By</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Styled to match the physical image exactly) */}
      <div className="bg-gray-100 dark:bg-gray-950 p-2 sm:p-6 rounded-xl print:p-0 print:bg-white print:m-0">
        <div
          ref={printRef}
          className="mx-auto bg-white text-gray-900 p-6 md:p-10 shadow-lg print:shadow-none print:p-0 print:max-w-none max-w-4xl border border-gray-300 print:border-none font-sans text-xs min-h-[1000px] print:min-h-0 print:w-full print:text-black"
        >
          {/* Main Outer Box Border matching physical document image */}
          <div className="border-2 border-gray-800 p-4 md:p-6 space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-1">
              <h1 className="text-xl md:text-2xl font-black text-red-600 tracking-wide uppercase">
                CDN ENGINEERS PVT LTD
              </h1>
              <h2 className="text-sm md:text-base font-bold text-gray-900 tracking-wider uppercase underline decoration-1">
                {docType === "delivery" ? "MATERIAL DELIVERY NOTE" : "MATERIAL ISSUE NOTE"}
              </h2>
            </div>

            {/* Document Info Table Grid */}
            <div className="border border-gray-800">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="w-1/3 px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      Company Name
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      {project.customer?.companyName || "N/A"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      Address
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      {project.customer?.address || project.location || "N/A"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      Contact Number
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      {project.customer?.phone || "N/A"} {project.customer?.contactPerson ? `(${project.customer.contactPerson})` : ""}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      {docType === "delivery" ? "Delivery Note No." : "Issue Note No."}
                    </td>
                    <td className="px-3 py-1.5 font-mono font-bold">
                      {docNo}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      Date
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      {formatDate(docDate)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      Project Name / Site
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      {project.projectName} ({project.projectCode})
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-bold bg-gray-100 border-r border-gray-800">
                      Site Address
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      {project.location || project.customer?.address || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 1: Details Table */}
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
                      <td
                        colSpan={docType === "issue" ? 7 : 5}
                        className="text-center py-6 text-gray-500"
                      >
                        No items found for the selected date filter.
                      </td>
                    </tr>
                  ) : (
                    deliveryLineItems.map((item, idx) => {
                      const rowTotal = item.quantity * item.unitPrice;
                      return (
                        <tr key={item.id} className="border-b border-gray-800">
                          <td className="px-2.5 py-1.5 border-r border-gray-800 text-center font-medium">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-1.5 border-r border-gray-800 font-medium">
                            {item.description}
                          </td>
                          <td className="px-2.5 py-1.5 border-r border-gray-800 text-center">
                            {item.unit}
                          </td>
                          <td className="px-2.5 py-1.5 border-r border-gray-800 text-center font-bold">
                            {item.quantity}
                          </td>

                          {docType === "issue" && (
                            <>
                              <td className="px-3 py-1.5 border-r border-gray-800 text-right font-mono">
                                <span className="print:inline hidden">
                                  {formatCurrency(item.unitPrice)}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    setCustomPrices({
                                      ...customPrices,
                                      [item.id]: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="print:hidden w-20 px-1 py-0.5 border border-gray-300 rounded text-right"
                                />
                              </td>
                              <td className="px-3 py-1.5 border-r border-gray-800 text-right font-mono font-bold">
                                {formatCurrency(rowTotal)}
                              </td>
                            </>
                          )}

                          <td className="px-3 py-1.5 text-gray-600 font-normal">
                            {item.remarks}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Grand Total Row for Issue Note */}
                  {docType === "issue" && deliveryLineItems.length > 0 && (
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
                      <td colSpan={5} className="px-3 py-2 text-right border-r border-gray-800 uppercase">
                        Grand Total (LKR):
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm border-r border-gray-800 font-black text-teal-900">
                        {formatCurrency(issueNoteGrandTotal)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Transport Details */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-gray-900">2. Transport Details</h3>
              <div className="border border-gray-800 flex">
                <div className="w-32 px-3 py-2 font-bold bg-gray-100 border-r border-gray-800">
                  Vehicle No
                </div>
                <div className="px-4 py-2 font-semibold font-mono text-gray-900 flex-1">
                  {vehicleNo || "..........................................................."}
                </div>
              </div>
            </div>

            {/* Section 3: Confirmation */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-gray-900">3. Confirmation</h3>

              {/* Delivered By */}
              <div className="space-y-1">
                <p className="font-semibold text-xs">Delivered By:</p>
                <table className="w-full text-xs border-collapse border border-gray-800">
                  <tbody>
                    <tr>
                      <td className="w-1/3 px-3 py-2 border-r border-gray-800">
                        <strong>Name:</strong> {deliveredBy}
                      </td>
                      <td className="w-1/3 px-3 py-2 border-r border-gray-800">
                        <strong>Signature:</strong>
                      </td>
                      <td className="w-1/3 px-3 py-2">
                        <strong>Date:</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Received By */}
              <div className="space-y-1">
                <p className="font-semibold text-xs">Received By:</p>
                <div className="grid grid-cols-3 border border-gray-800">
                  <div className="col-span-2 border-r border-gray-800">
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-800">
                          <td className="px-3 py-2 border-r border-gray-800 w-1/2">
                            <strong>Name:</strong> {receivedBy}
                          </td>
                          <td className="px-3 py-2 w-1/2">
                            <strong>Signature:</strong>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-3 py-2">
                            <strong>Date:</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 text-center text-gray-400 font-semibold flex items-center justify-center border-l border-gray-800">
                    Received Company Seal
                  </div>
                </div>
              </div>
            </div>

            {/* Note & Footer Disclaimer */}
            <div className="pt-4 border-t border-gray-400 text-xs space-y-1 text-gray-800">
              <p className="font-bold">Note:</p>
              <p>Please check all materials upon delivery.</p>
              <p>Any discrepancies or damages should be reported immediately.</p>
              <div className="pt-6 border-b border-dashed border-gray-500 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific CSS Rules */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, sidebar, button, .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default ProjectDeliveryAndIssueNotesTab;
