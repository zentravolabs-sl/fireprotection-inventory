// ============================================================
// src/app/(Main)/fire-extinguishers/deliveries/[id]/print/page.tsx
// Printable A4 Client Delivery Note Layout
// Route: /fire-extinguishers/deliveries/:id/print
// ============================================================

import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { Flame } from "lucide-react";
import { PrintButton } from "@/components/fire-extinguishers/PrintButton";
import { InlinePdfDownloadButton } from "@/components/fire-extinguishers/DeliveryNoteDetailActions";

export const dynamic = "force-dynamic";

interface PrintDeliveryNotePageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintDeliveryNotePage({ params }: PrintDeliveryNotePageProps) {
  const { id } = await params;
  const deliveryId = Number(id);

  if (isNaN(deliveryId)) {
    notFound();
  }

  // ── Auth guard ───────────────────────────────────────────────────────────────
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();
  const userRole = (session?.user as { role?: string })?.role ?? "USER";

  const canView =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    permissions.has("fire_extinguisher.view");

  if (!session?.user) {
    redirect("/login");
  }

  if (!canView) {
    redirect("/fire-extinguishers/deliveries");
  }

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      items: {
        include: {
          fireExtinguisherUnit: {
            include: { inventory: true },
          },
        },
        orderBy: { id: "asc" },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!deliveryNote) {
    notFound();
  }

  const deliveryDate = new Date(deliveryNote.deliveryDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const createdDate = new Date(deliveryNote.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      {/* ─── Print-specific CSS ──────────────────────────────────────────────── */}
      <style>{`
        @media print {
          /* Hide everything except the delivery note sheet */
          body > *:not(.dn-print-root) { display: none !important; }
          .print\\:hidden { display: none !important; }
          .no-print { display: none !important; }

          /* A4 page setup */
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

          /* Avoid table row page breaks mid-row */
          tr { page-break-inside: avoid; }

          /* Keep signature block together */
          .dn-signatures { page-break-inside: avoid; }
        }
      `}</style>

      <div className="dn-print-root min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-8 flex justify-center print:bg-white print:p-0">
        {/* A4 Sheet */}
        <div className="dn-sheet bg-white text-gray-900 w-full max-w-[210mm] shadow-2xl rounded-2xl border border-gray-200 print:shadow-none print:rounded-none print:border-none flex flex-col">

          {/* ── Action Bar (hidden in print) ───────────────────────────────── */}
          <div className="no-print flex items-center justify-between border-b border-gray-200 px-8 py-4 gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Print Preview
              </div>
              <div className="text-sm font-black text-gray-900 mt-0.5">
                {deliveryNote.deliveryNo}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <InlinePdfDownloadButton
                deliveryNoteId={deliveryNote.id}
                deliveryNo={deliveryNote.deliveryNo}
              />
              <PrintButton />
            </div>
          </div>

          {/* ── Document Body ──────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-between px-10 pt-8 pb-8 space-y-6">

            {/* HEADER */}
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
                    DELIVERY NOTE
                  </div>
                  <div className="text-base font-black text-gray-900 font-mono">
                    {deliveryNote.deliveryNo}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Date: <span className="font-semibold text-gray-800">{deliveryDate}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Created: {createdDate}
                  </div>
                </div>
              </div>

              {/* Red divider */}
              <div className="w-full border-t-2 border-red-600" />

              {/* CUSTOMER & DELIVERY INFO */}
              <div className="grid grid-cols-2 gap-5">
                {/* Deliver To */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    DELIVER TO:
                  </div>
                  <div className="text-[13px] font-black text-gray-900 leading-tight">
                    {deliveryNote.customer.companyName}
                  </div>
                  {deliveryNote.customer.contactPerson && (
                    <div className="text-[10px] text-gray-600 mt-1">
                      Attn: {deliveryNote.customer.contactPerson}
                    </div>
                  )}
                  {deliveryNote.customer.phone && (
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      Phone: {deliveryNote.customer.phone}
                    </div>
                  )}
                  {deliveryNote.customer.email && (
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      Email: {deliveryNote.customer.email}
                    </div>
                  )}
                </div>

                {/* Delivery Location */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    DELIVERY LOCATION / ADDRESS:
                  </div>
                  <div className="text-[11px] text-gray-800 leading-relaxed font-medium">
                    {deliveryNote.deliveryAddress || deliveryNote.customer.address || "Client Premises"}
                  </div>
                  {deliveryNote.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500 italic">
                      Note: {deliveryNote.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div>
                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Dispatched Fire Extinguisher Units &nbsp;({deliveryNote.items.length} Item{deliveryNote.items.length !== 1 ? "s" : ""})
                </div>
                <table className="w-full text-left border-collapse border border-gray-200 text-[11px]">
                  <thead>
                    <tr className="bg-red-600 text-white font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3 w-9 text-center border-r border-red-500">#</th>
                      <th className="py-2.5 px-3 border-r border-red-500 w-28">Unit Code</th>
                      <th className="py-2.5 px-3 border-r border-red-500">Item Description</th>
                      <th className="py-2.5 px-3 border-r border-red-500 w-32">Serial No.</th>
                      <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryNote.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="py-2.5 px-3 border border-gray-200 text-center text-gray-500 font-semibold">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 font-bold text-gray-900 font-mono">
                          {item.fireExtinguisherUnit.unitCode}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 font-semibold text-gray-800">
                          {item.fireExtinguisherUnit.inventory.name}
                          <span className="ml-2 text-[9px] text-gray-400 font-normal font-mono">
                            [{item.fireExtinguisherUnit.inventory.itemCode}]
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 font-mono text-gray-500">
                          {item.fireExtinguisherUnit.serialNumber || "—"}
                        </td>
                        <td className="py-2.5 px-3 border border-gray-200 text-gray-600 text-center">
                          {item.fireExtinguisherUnit.inventory.unit}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <td colSpan={2} className="py-2.5 px-3 border border-gray-200 text-gray-700 text-right font-bold uppercase text-[10px]">
                        Total
                      </td>
                      <td className="py-2.5 px-3 border border-gray-200 font-black text-gray-900">
                        {deliveryNote.items.length} Unit{deliveryNote.items.length !== 1 ? "s" : ""} Dispatched
                      </td>
                      <td className="py-2.5 px-3 border border-gray-200" />
                      <td className="py-2.5 px-3 border border-gray-200" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SIGNATURE SECTION ─────────────────────────────────────────── */}
            <div className="dn-signatures pt-6 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-12 text-[11px] text-gray-700">
                {/* Delivered By */}
                <div className="space-y-1">
                  <div className="font-black text-gray-900 text-[12px]">DELIVERED BY:</div>
                  <div className="text-[10px] text-gray-500">CDN Fire Engineering Logistics</div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="text-[9px] text-gray-400 mb-1">Name:</div>
                      <div className="border-b border-gray-400 pb-0.5 text-gray-800 font-medium">
                        {deliveryNote.createdBy?.name || ""}
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
                  <div className="text-[10px] text-gray-500">{deliveryNote.customer.companyName}</div>
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

              {/* Footer */}
              <div className="mt-8 pt-3 border-t border-gray-100 text-center text-[9px] text-gray-400">
                Thank you for choosing CDN Fire Engineering. All fire extinguishers are inspected prior to dispatch.
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
