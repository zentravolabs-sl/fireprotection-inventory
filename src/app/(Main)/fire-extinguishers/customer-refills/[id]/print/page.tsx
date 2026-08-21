// ============================================================
// src/app/(Main)/fire-extinguishers/customer-refills/[id]/print/page.tsx
// Printable A4 Customer Refill Receipt Layout
// ============================================================

import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Flame } from "lucide-react";
import { PrintButton } from "@/components/fire-extinguishers/PrintButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintCustomerRefillReceiptPage({ params }: Props) {
  const { id } = await params;
  const refillId = Number(id);
  if (isNaN(refillId)) notFound();

  const refillJob = await prisma.customerRefill.findUnique({
    where: { id: refillId },
    include: {
      customer: true,
      items: true,
      replacements: {
        include: { inventory: true },
      },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!refillJob) notFound();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-8 flex justify-center print:bg-white print:p-0">
      {/* Printable Sheet Wrapper */}
      <div className="bg-white text-gray-900 w-full max-w-[210mm] min-h-[297mm] p-8 shadow-xl rounded-xl print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-0 flex flex-col justify-between border border-gray-200 print:border-none space-y-6">

        <div className="space-y-6">
          {/* Header Action Strip (Hidden in Print) */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
            <div className="text-xs text-gray-500 font-medium">
              Customer Refill Receipt Preview — #{refillJob.refillNo}
            </div>
            <PrintButton />
          </div>

          {/* Company Branding & Document Header */}
          <div className="flex items-start justify-between border-b-2 border-red-600 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Flame size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                  CDN Fire Engineering
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Fire Protection &amp; Safety Equipment Systems
                </p>
                <p className="text-[11px] text-gray-400">
                  100 Industrial Parkway, Suite 400 • Phone: +94 11 234 5678 • service@cdnfire.com
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-black rounded-lg border border-amber-300 uppercase tracking-wider mb-1">
                Refill Receipt
              </div>
              <div className="text-base font-bold text-gray-900 font-mono">{refillJob.refillNo}</div>
              <div className="text-xs text-gray-500 font-medium">
                Received:{" "}
                {new Date(refillJob.receivedDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                CUSTOMER / CLIENT DETAILS:
              </div>
              <div className="text-sm font-bold text-gray-900">{refillJob.customer.companyName}</div>
              {refillJob.customer.contactPerson && (
                <div className="text-xs text-gray-600 mt-0.5">Attn: {refillJob.customer.contactPerson}</div>
              )}
              {refillJob.customer.phone && (
                <div className="text-xs text-gray-600">Phone: {refillJob.customer.phone}</div>
              )}
              {refillJob.customer.email && (
                <div className="text-xs text-gray-600">Email: {refillJob.customer.email}</div>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                JOB STATUS &amp; REMARKS:
              </div>
              <div className="text-xs font-bold text-gray-800 uppercase">
                Status: {refillJob.status.replace(/_/g, " ")}
              </div>
              {refillJob.notes ? (
                <div className="mt-1 text-[11px] text-gray-600 italic bg-white p-2 rounded border border-gray-200">
                  {refillJob.notes}
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-1 italic">
                  Standard refill inspection and servicing.
                </div>
              )}
            </div>
          </div>

          {/* Customer-Owned Items Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              1. Customer-Owned Fire Extinguishers Received ({refillJob.items.length} Items)
            </div>
            <table className="w-full text-left border-collapse border border-gray-200 text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 text-[11px] uppercase">
                  <th className="py-2.5 px-3 border-r border-gray-200 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Fire Extinguisher Type</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Capacity</th>
                  <th className="py-2.5 px-3 text-center">Qty Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {refillJob.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 border-r border-gray-200 text-center font-semibold text-gray-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 font-bold text-gray-900">
                      {item.extinguisherType}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 text-gray-600 font-mono">
                      {item.capacity || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-900 font-mono">
                      {item.receivedQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Temporary Replacements (If issued) */}
          {refillJob.replacements.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                2. Temporary Replacement Extinguishers Issued ({refillJob.replacements.length} Items)
              </div>
              <table className="w-full text-left border-collapse border border-purple-200 text-xs">
                <thead>
                  <tr className="bg-purple-50 text-purple-900 font-bold border-b border-purple-200 text-[11px] uppercase">
                    <th className="py-2.5 px-3 border-r border-purple-200 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-purple-200">Item</th>
                    <th className="py-2.5 px-3 border-r border-purple-200">Code</th>
                    <th className="py-2.5 px-3 text-center">Qty Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {refillJob.replacements.map((repl, index) => (
                    <tr key={repl.id}>
                      <td className="py-2.5 px-3 border-r border-purple-200 text-center font-semibold text-purple-600">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-purple-200 font-bold text-gray-900">
                        {repl.inventory.name} ({repl.inventory.unit})
                      </td>
                      <td className="py-2.5 px-3 border-r border-purple-200 font-mono text-gray-600">
                        {repl.inventory.itemCode}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-900 font-mono">
                        {repl.issuedQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Signatures */}
        <div className="pt-8 border-t border-gray-200 space-y-6">
          <div className="grid grid-cols-3 gap-8 text-xs text-gray-700">
            <div className="space-y-8">
              <div>
                <div className="font-bold text-gray-900">RECEIVED BY:</div>
                <div className="text-[11px] text-gray-500">CDN Fire Logistics</div>
              </div>
              <div className="space-y-2">
                <div className="border-b border-gray-400 w-full"></div>
                <div className="text-[10px] text-gray-500">
                  Name: {refillJob.createdBy?.name || "_________________"}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="font-bold text-gray-900">CUSTOMER SIGNATURE:</div>
                <div className="text-[11px] text-gray-500">{refillJob.customer.companyName}</div>
              </div>
              <div className="space-y-2">
                <div className="border-b border-gray-400 w-full"></div>
                <div className="text-[10px] text-gray-500">Authorized Signature &amp; Stamp</div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="font-bold text-gray-900">COMPANY AUTHORIZATION:</div>
                <div className="text-[11px] text-gray-500">CDN Fire Engineering</div>
              </div>
              <div className="space-y-2">
                <div className="border-b border-gray-400 w-full"></div>
                <div className="text-[10px] text-gray-500">Date: _________________</div>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 pt-4 border-t border-gray-100">
            Customer-owned fire extinguishers are accepted for servicing &amp; hydrostatic test under standard service agreement terms.
          </div>
        </div>

      </div>
    </div>
  );
}
