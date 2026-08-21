// ============================================================
// src/app/(Main)/fire-extinguishers/deliveries/[id]/print/page.tsx
// Printable A4 Client Delivery Note Layout
// ============================================================

import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Flame, Printer } from "lucide-react";
import { PrintButton } from "@/components/fire-extinguishers/PrintButton";

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
      },
      createdBy: true,
    },
  });

  if (!deliveryNote) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-8 flex justify-center print:bg-white print:p-0">
      {/* Printable Sheet Wrapper */}
      <div className="bg-white text-gray-900 w-full max-w-[210mm] min-h-[297mm] p-8 shadow-xl rounded-xl print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-0 flex flex-col justify-between border border-gray-200 print:border-none space-y-6">
        
        <div className="space-y-6">
          {/* Header Action Strip (Hidden in Print) */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
            <div className="text-xs text-gray-500 font-medium">
              Delivery Note Preview — #{deliveryNote.deliveryNo}
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
                  Fire Protection & Safety Equipment Systems
                </p>
                <p className="text-[11px] text-gray-400">
                  100 Industrial Parkway, Suite 400 • Phone: +94 11 234 5678 • sales@cdnfire.com
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-black rounded-lg border border-red-200 uppercase tracking-wider mb-1">
                Delivery Note
              </div>
              <div className="text-base font-bold text-gray-900 font-mono">
                {deliveryNote.deliveryNo}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Date: {new Date(deliveryNote.deliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                DELIVER TO (CUSTOMER):
              </div>
              <div className="text-sm font-bold text-gray-900">{deliveryNote.customer.companyName}</div>
              {deliveryNote.customer.contactPerson && (
                <div className="text-xs text-gray-600 mt-0.5">Attn: {deliveryNote.customer.contactPerson}</div>
              )}
              {deliveryNote.customer.phone && (
                <div className="text-xs text-gray-600">Phone: {deliveryNote.customer.phone}</div>
              )}
              {deliveryNote.customer.email && (
                <div className="text-xs text-gray-600">Email: {deliveryNote.customer.email}</div>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                DELIVERY LOCATION / ADDRESS:
              </div>
              <div className="text-xs text-gray-800 leading-relaxed font-medium">
                {deliveryNote.deliveryAddress || deliveryNote.customer.address || "Client Premises"}
              </div>
              {deliveryNote.notes && (
                <div className="mt-2 text-[11px] text-gray-500 italic bg-white p-2 rounded border border-gray-200">
                  Note: {deliveryNote.notes}
                </div>
              )}
            </div>
          </div>

          {/* Equipment Items Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Dispatched Fire Extinguisher Units ({deliveryNote.items.length} Items)
            </div>
            <table className="w-full text-left border-collapse border border-gray-200 text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 text-[11px] uppercase">
                  <th className="py-2.5 px-3 border-r border-gray-200 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Unit Code</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Item Description</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Capacity / Unit</th>
                  <th className="py-2.5 px-3">Serial Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveryNote.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 border-r border-gray-200 text-center font-semibold text-gray-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 font-bold text-gray-900 font-mono">
                      {item.fireExtinguisherUnit.unitCode}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 font-semibold text-gray-800">
                      {item.fireExtinguisherUnit.inventory.name}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 text-gray-600 font-mono">
                      {item.fireExtinguisherUnit.inventory.unit}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 font-mono">
                      {item.fireExtinguisherUnit.serialNumber || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="pt-8 border-t border-gray-200 space-y-6">
          <div className="grid grid-cols-2 gap-12 text-xs text-gray-700">
            <div className="space-y-8">
              <div>
                <div className="font-bold text-gray-900">DELIVERED BY:</div>
                <div className="text-[11px] text-gray-500">CDN Fire Engineering Logistics</div>
              </div>
              <div className="space-y-2">
                <div className="border-b border-gray-400 w-full"></div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Name: {deliveryNote.createdBy?.name || "_________________"}</span>
                  <span>Signature & Date</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="font-bold text-gray-900">RECEIVED IN GOOD CONDITION BY:</div>
                <div className="text-[11px] text-gray-500">{deliveryNote.customer.companyName}</div>
              </div>
              <div className="space-y-2">
                <div className="border-b border-gray-400 w-full"></div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Authorized Signature & Stamp</span>
                  <span>Date: _________________</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 pt-4 border-t border-gray-100">
            Thank you for choosing CDN Fire Engineering. All fire extinguishers are inspected prior to dispatch.
          </div>
        </div>

      </div>
    </div>
  );
}
