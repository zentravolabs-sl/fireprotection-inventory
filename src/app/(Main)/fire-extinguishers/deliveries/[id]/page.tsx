// ============================================================
// src/app/(Main)/fire-extinguishers/deliveries/[id]/page.tsx
// Delivery Note Detail Page
// Route: /fire-extinguishers/deliveries/:id
// ============================================================

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { DeliveryNoteDetailActions } from "@/components/fire-extinguishers/DeliveryNoteDetailActions";
import {
  ArrowLeft,
  Truck,
  Building2,
  Calendar,
  User,
  MapPin,
  FileText,
  Hash,
  Flame,
  AlignLeft,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Delivery Note #${id} — CDN Fire Engineering`,
    description: "Client delivery note detail view.",
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES = {
  DRAFT: {
    label: "Draft",
    bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-300",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-300",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700",
    text: "text-rose-800 dark:text-rose-300",
  },
};

export default async function DeliveryNoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deliveryId = Number(id);

  if (isNaN(deliveryId)) {
    notFound();
  }

  // ── Auth & Permissions ───────────────────────────────────────────────────────
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();
  const userRole = (session?.user as { role?: string })?.role ?? "USER";

  const canView =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    permissions.has("fire_extinguisher.view");

  const canDeliver =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    permissions.has("fire_extinguisher.deliver");

  if (!canView) {
    notFound();
  }

  // ── Fetch Delivery Note ──────────────────────────────────────────────────────
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

  const statusStyle = STATUS_STYLES[deliveryNote.status] ?? STATUS_STYLES.DRAFT;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back nav */}
        <div>
          <Link
            href="/fire-extinguishers/deliveries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Delivery Notes
          </Link>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-600 shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  {deliveryNote.deliveryNo}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusStyle.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Client Delivery Note
              </p>
            </div>
          </div>

          {/* Action Buttons — client component */}
          <DeliveryNoteDetailActions
            deliveryNoteId={deliveryNote.id}
            deliveryNo={deliveryNote.deliveryNo}
            status={deliveryNote.status}
            canDeliver={canDeliver}
          />
        </div>

        {/* Info cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Delivery Date */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3">
            <Calendar size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                Delivery Date
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {new Date(deliveryNote.deliveryDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Total Units */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3">
            <Flame size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                Total Units
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {deliveryNote.items.length} Unit{deliveryNote.items.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Created By */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3">
            <User size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                Created By
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {deliveryNote.createdBy?.name ?? "System"}
              </div>
            </div>
          </div>

          {/* Created At */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3">
            <Clock size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                Created Date
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {new Date(deliveryNote.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Customer details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Customer Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <Building2 size={15} className="text-red-600" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {deliveryNote.customer.companyName}
                </div>
                {deliveryNote.customer.contactPerson && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contact: {deliveryNote.customer.contactPerson}
                  </div>
                )}
                {deliveryNote.customer.phone && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Phone: {deliveryNote.customer.phone}
                  </div>
                )}
                {deliveryNote.customer.email && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Email: {deliveryNote.customer.email}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <MapPin size={15} className="text-red-600" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Delivery Address
                </span>
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {deliveryNote.deliveryAddress || deliveryNote.customer.address || (
                  <span className="text-gray-400 italic">No address specified</span>
                )}
              </div>
            </div>

            {/* Notes Card */}
            {deliveryNote.notes && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                  <AlignLeft size={15} className="text-red-600" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  {deliveryNote.notes}
                </div>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
                <FileText size={15} className="text-red-600" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Fire Extinguisher Units — {deliveryNote.items.length} Item{deliveryNote.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                      <th className="py-3 px-4 w-10 text-center">#</th>
                      <th className="py-3 px-4">Unit Code</th>
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Serial No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {deliveryNote.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                          No items in this delivery note.
                        </td>
                      </tr>
                    ) : (
                      deliveryNote.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-gray-400 font-semibold">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Flame size={11} className="text-red-500 shrink-0" />
                              {item.fireExtinguisherUnit.unitCode}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                            {item.fireExtinguisherUnit.inventory.name}
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-normal">
                              {item.fireExtinguisherUnit.inventory.itemCode}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {item.fireExtinguisherUnit.inventory.unit}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-500 dark:text-gray-400">
                            {item.fireExtinguisherUnit.serialNumber ?? (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Status banner for DELIVERED */}
        {deliveryNote.status === "DELIVERED" && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
            <Hash size={14} className="shrink-0" />
            <span>
              This delivery note has been confirmed and delivered. Stock has been updated. No further edits are allowed.
            </span>
          </div>
        )}

        {deliveryNote.status === "CANCELLED" && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
            <Hash size={14} className="shrink-0" />
            <span>This delivery note has been cancelled. No stock changes were made.</span>
          </div>
        )}

      </div>
    </div>
  );
}
