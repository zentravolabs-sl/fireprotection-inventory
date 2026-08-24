// ============================================================
// src/app/(Main)/fire-extinguishers/customer-refills/[id]/print/page.tsx
// Printable A4 Customer Refill Delivery Note
// Route: /fire-extinguishers/customer-refills/:id/print
// ============================================================

import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { Flame } from "lucide-react";
import { PrintButton } from "@/components/fire-extinguishers/PrintButton";
import { CustomerRefillPdfDownloadButton } from "@/components/fire-extinguishers/CustomerRefillPdfDownloadButton";

export const dynamic = "force-dynamic";

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintCustomerRefillDeliveryNote({ params }: PrintPageProps) {
  const { id } = await params;
  const refillId = Number(id);
  if (isNaN(refillId)) notFound();

  // ── Auth guard ───────────────────────────────────────────────────────────────
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();
  const userRole = (session?.user as { role?: string })?.role ?? "USER";

  const canView =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    permissions.has("customerRefills.view");

  if (!session?.user) redirect("/login");
  if (!canView) redirect("/fire-extinguishers/customer-refills");

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const refill = await prisma.customerRefill.findUnique({
    where: { id: refillId },
    include: {
      customer: true,
      items: { orderBy: { id: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  if (!refill) notFound();

  // ── Format dates ─────────────────────────────────────────────────────────────
  function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function fmtDateShort(d: Date | string | null | undefined): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const receivedDate = fmtDate(refill.receivedDate);
  const completedDate = fmtDate(refill.completedDate);
  const printedDate = fmtDateShort(new Date());

  // Totals
  const totalReceived = refill.items.reduce((s, i) => s + i.receivedQty, 0);
  const totalReturned = refill.items.reduce((s, i) => s + i.returnedQty, 0);

  return (
    <>
      {/* ─── Print-specific CSS ──────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body > *:not(.dn-print-root) { display: none !important; }
          .print\\:hidden { display: none !important; }
          .no-print { display: none !important; }

          @page {
            size: A4 portrait;
            margin: 12mm 14mm 14mm 14mm;
          }

          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .dn-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          tr { page-break-inside: avoid; }
          .dn-signatures { page-break-inside: avoid; }
        }
      `}</style>

      <div className="dn-print-root min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-8 flex justify-center print:bg-white print:p-0">
        {/* A4 Sheet */}
        <div className="dn-sheet bg-white text-gray-900 w-full max-w-[210mm] shadow-2xl rounded-2xl border border-gray-200 print:shadow-none print:rounded-none print:border-none flex flex-col">

          {/* ── Action Bar (hidden in print) ─────────────────────────────────── */}
          <div className="no-print flex items-center justify-between border-b border-gray-200 px-8 py-4 gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Print Preview — Refill Delivery Note
              </div>
              <div className="text-sm font-black text-gray-900 mt-0.5 font-mono">
                {refill.refillNo}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CustomerRefillPdfDownloadButton refillId={refill.id} refillNo={refill.refillNo} />
              <PrintButton />
            </div>
          </div>

          {/* ── Document Body ───────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-between px-10 pt-8 pb-8 space-y-6">

            <div className="space-y-6">
              {/* Red top accent bar */}
              <div className="w-full h-1 bg-red-600 rounded-full" />

              {/* Company + Document Header */}
              <div className="flex items-start justify-between">
                {/* Company branding */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                    <Flame size={26} />
                  </div>
                  <div>
                    <h1 className="text-[22px] font-black text-gray-900 tracking-tight uppercase leading-none">
                      CDN Fire Engineering
                    </h1>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      Fire Protection &amp; Safety Equipment Systems
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      100 Industrial Parkway, Suite 400 &nbsp;•&nbsp; +94 11 234 5678 &nbsp;•&nbsp; sales@cdnfire.com
                    </p>
                  </div>
                </div>

                {/* Document label */}
                <div className="text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest mb-2">
                    REFILL DELIVERY NOTE
                  </div>
                  <div className="text-base font-black text-gray-900 font-mono">
                    {refill.refillNo}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Return Date: <span className="font-semibold text-gray-800">{completedDate}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Received: {receivedDate}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Printed: {printedDate}
                  </div>
                </div>
              </div>

              {/* Red divider */}
              <div className="w-full border-t-2 border-red-600" />

              {/* CUSTOMER & DELIVERY INFO */}
              <div className="grid grid-cols-2 gap-5">
                {/* Return To */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    RETURN TO CUSTOMER:
                  </div>
                  <div className="text-[13px] font-black text-gray-900 leading-tight">
                    {refill.customer.companyName}
                  </div>
                  {refill.customer.contactPerson && (
                    <div className="text-[10px] text-gray-600 mt-1">
                      Attn: {refill.customer.contactPerson}
                    </div>
                  )}
                  {refill.customer.phone && (
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      Phone: {refill.customer.phone}
                    </div>
                  )}
                  {refill.customer.email && (
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      Email: {refill.customer.email}
                    </div>
                  )}
                </div>

                {/* Job Details */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    JOB DETAILS:
                  </div>
                  <div className="space-y-1.5 text-[10px] text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Refill Job No:</span>
                      <span className="font-black text-gray-900 font-mono">{refill.refillNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date Received:</span>
                      <span className="font-semibold">{receivedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date Returned:</span>
                      <span className="font-semibold">{completedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prepared By:</span>
                      <span className="font-semibold">{refill.createdBy?.name || "—"}</span>
                    </div>
                    {refill.customer.address && (
                      <div className="pt-1.5 border-t border-gray-200 text-gray-500 italic leading-relaxed">
                        {refill.customer.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div>
                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Refilled Fire Extinguisher Units &nbsp;({refill.items.length} Line Item{refill.items.length !== 1 ? "s" : ""})
                </div>
                <table className="w-full text-left border-collapse border border-gray-200 text-[11px]">
                  <thead>
                    <tr className="bg-red-600 text-white font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3 w-9 text-center border-r border-red-500">#</th>
                      <th className="py-2.5 px-3 border-r border-red-500">Extinguisher Type</th>
                      <th className="py-2.5 px-3 border-r border-red-500 w-20 text-center">Capacity</th>
                      <th className="py-2.5 px-3 border-r border-red-500 w-16 text-center">Qty Received</th>
                      <th className="py-2.5 px-3 border-r border-red-500 w-16 text-center">Qty Returned</th>
                      <th className="py-2.5 px-3 border-r border-red-500 w-28">Refill Date</th>
                      <th className="py-2.5 px-3 w-28">Expire Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refill.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="py-2.5 px-3 border border-gray-200 text-center text-gray-500 font-semibold">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 font-bold text-gray-900">
                          {item.extinguisherType}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 text-center text-gray-600">
                          {item.capacity || "—"}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 text-center font-mono font-bold text-gray-800">
                          {item.receivedQty}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 text-center font-mono font-bold text-emerald-700">
                          {item.returnedQty}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 text-gray-700">
                          {fmtDateShort(item.refillDate)}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 font-semibold text-amber-700">
                          {fmtDateShort(item.expireDate)}
                        </td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr className="bg-red-50 font-bold border-t-2 border-red-200">
                      <td colSpan={3} className="py-2.5 px-3 border border-gray-200 text-right text-gray-700 text-[10px] uppercase font-bold">
                        Total
                      </td>
                      <td className="py-2.5 px-3 border border-gray-200 text-center font-black text-gray-900 font-mono">
                        {totalReceived}
                      </td>
                      <td className="py-2.5 px-3 border border-gray-200 text-center font-black text-emerald-700 font-mono">
                        {totalReturned}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 border border-gray-200 text-[10px] text-gray-500 italic">
                        {totalReturned === totalReceived
                          ? "✓ All units returned"
                          : `${totalReceived - totalReturned} unit(s) pending`}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Notes */}
                {refill.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-[10px] text-gray-600 italic">
                    <span className="font-bold text-gray-400 uppercase not-italic">Notes: </span>
                    {refill.notes}
                  </div>
                )}
              </div>
            </div>

            {/* ── SIGNATURE SECTION ───────────────────────────────────────────── */}
            <div className="dn-signatures pt-6 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-12 text-[11px] text-gray-700">
                {/* Delivered By */}
                <div className="space-y-1">
                  <div className="font-black text-gray-900 text-[12px]">RETURNED BY:</div>
                  <div className="text-[10px] text-gray-500">CDN Fire Engineering</div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Name:</div>
                      <div className="border-b border-gray-400 pb-0.5 text-gray-800 font-medium">
                        {refill.createdBy?.name || ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Signature:</div>
                      <div className="border-b border-gray-400 pb-5" />
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Date:</div>
                      <div className="border-b border-gray-400 pb-0.5" />
                    </div>
                  </div>
                </div>

                {/* Received By */}
                <div className="space-y-1">
                  <div className="font-black text-gray-900 text-[12px]">RECEIVED IN GOOD CONDITION BY:</div>
                  <div className="text-[10px] text-gray-500">{refill.customer.companyName}</div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Name:</div>
                      <div className="border-b border-gray-400 pb-0.5" />
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Signature &amp; Stamp:</div>
                      <div className="border-b border-gray-400 pb-5" />
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Date:</div>
                      <div className="border-b border-gray-400 pb-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Warranty / certification notice */}
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-[9px] text-red-800 text-center font-medium">
                All fire extinguishers have been inspected, serviced, and refilled in accordance with applicable fire safety standards.
                This document serves as proof of service completion and return of equipment to the client.
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-center text-[9px] text-gray-400">
                Thank you for choosing CDN Fire Engineering. For queries, contact us at +94 11 234 5678 or sales@cdnfire.com
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
