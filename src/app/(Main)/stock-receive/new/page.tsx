// ============================================================
// src/app/(Main)/stock-receive/new/page.tsx
// New Stock Receive Form Page.
// ============================================================

import { getSuppliers } from "@/app/(Main)/suppliers/actions";
import { getInventoryList } from "@/app/(Main)/inventory/actions";
import { generateReceiveNo } from "../actions";
import StockReceiveForm from "../components/StockReceiveForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Goods Receive â€” CDN Fire Engineering",
  description: "Create a new Goods Receive Note for incoming inventory.",
};

export default async function NewStockReceivePage() {
  const [supResult, inventoryItems, nextReceiveNo] = await Promise.all([
    getSuppliers({ limit: 100 }),
    getInventoryList(),
    generateReceiveNo(),
  ]);

  return (
    <div className="min-h-screen bg-[#0F1524] p-4 sm:p-6 max-w-7xl mx-auto">
      <StockReceiveForm
        nextReceiveNo={nextReceiveNo}
        suppliers={supResult.suppliers.map((s) => ({ id: s.id, company: s.company }))}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}
