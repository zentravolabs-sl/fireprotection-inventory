// ============================================================
// src/app/(Main)/admin/stock-receive/[id]/page.tsx
// Edit / View Stock Receive Details Page.
// ============================================================

import { notFound } from "next/navigation";
import { getSuppliers } from "@/app/(Main)/suppliers/actions";
import { getInventoryList } from "@/app/(Main)/inventory/actions";
import { getStockReceiveById, generateReceiveNo } from "../actions";
import StockReceiveForm from "../components/StockReceiveForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Goods Receive Details — CDN Fire Engineering",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStockReceivePage({ params }: PageProps) {
  const { id } = await params;
  const receiveId = parseInt(id, 10);

  if (isNaN(receiveId)) notFound();

  const [receive, supResult, inventoryItems, nextReceiveNo] = await Promise.all([
    getStockReceiveById(receiveId),
    getSuppliers({ limit: 100 }),
    getInventoryList(),
    generateReceiveNo(),
  ]);

  if (!receive) notFound();

  return (
    <div className="min-h-screen bg-[#0F1524] p-4 sm:p-6 max-w-7xl mx-auto">
      <StockReceiveForm
        initialData={receive}
        nextReceiveNo={nextReceiveNo}
        suppliers={supResult.suppliers.map((s) => ({ id: s.id, company: s.company }))}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}
