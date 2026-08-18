import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createTransportAction } from "@/app/actions/transport";
import { AlertTriangle, CheckCircle2, Truck, MapPin, DollarSign, Calendar } from "lucide-react";

const formatDateToString = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseStringToDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

interface LogTransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectCode: string;
}

export function LogTransportModal({
  isOpen,
  onClose,
  projectId,
  projectCode,
}: LogTransportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const [transportDate, setTransportDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [fuelCost, setFuelCost] = useState(0);
  const [vehicleHireCost, setVehicleHireCost] = useState(0);
  const [loadingCost, setLoadingCost] = useState(0);
  const [unloadingCost, setUnloadingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  const calculatedTotalCost =
    fuelCost + vehicleHireCost + loadingCost + unloadingCost + otherCost;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());
    formData.set("transportDate", transportDate);

    const res = await createTransportAction(formData);

    setLoading(false);

    if (res.success) {
      if ((res as any).requiresApproval) {
        setApprovalNotice((res as any).message);
      } else {
        onClose();
      }
    } else {
      setError(res.message);
    }
  }

  function handleNoticeClose() {
    setApprovalNotice(null);
    onClose();
  }

  const inputCls =
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <>
      {/* Main Transport Entry Modal */}
      <Modal
        isOpen={isOpen && !approvalNotice}
        onClose={onClose}
        title={`🚚 Log Transport Record — Project #${projectCode}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* Automatic Expense Rule Banner */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Truck size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Automatic Project Expense Ledger Entry</p>
              <p className="text-blue-700 dark:text-blue-300/90 leading-relaxed">
                Saving this record will log vehicle details and automatically register a <strong>TRANSPORT</strong> expense under Project Cost Breakdown.
              </p>
            </div>
          </div>

          {/* Section 1: Vehicle & Driver Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
              <Truck size={14} className="text-red-500" />
              Vehicle & Driver Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="Vehicle Number *"
                name="vehicleNumber"
                placeholder="e.g. WP-CP-1024"
                required
              />
              <FormInput
                label="Driver Name *"
                name="driverName"
                placeholder="e.g. Sunil Perera"
                required
              />
              <FormInput
                label="Transport Company"
                name="transportCompany"
                placeholder="e.g. Swift Logistics (Optional)"
              />
            </div>
          </div>

          {/* Section 2: Dispatch & Route Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
              <MapPin size={14} className="text-red-500" />
              Dispatch & Route Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Dispatch Date *
                </label>
                <DatePicker
                  selected={parseStringToDate(transportDate)}
                  onChange={(date: Date | null) => setTransportDate(formatDateToString(date))}
                  dateFormat="yyyy-MM-dd"
                  showPopperArrow={false}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
                  wrapperClassName="w-full"
                />
                <input type="hidden" name="transportDate" value={transportDate} />
              </div>
              <FormInput
                label="Dispatch Origin Location *"
                name="fromLocation"
                placeholder="e.g. Main Warehouse"
                required
              />
              <FormInput
                label="Destination Location *"
                name="toLocation"
                placeholder="e.g. Project Site Location"
                required
              />
            </div>
          </div>

          {/* Section 3: Cost Breakdown (LKR) */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
              <DollarSign size={14} className="text-red-500" />
              Transportation Cost Breakdown (LKR)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Fuel Cost</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="fuelCost"
                  value={fuelCost || ""}
                  onChange={(e) => setFuelCost(Number(e.target.value))}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Vehicle Hire</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="vehicleHireCost"
                  value={vehicleHireCost || ""}
                  onChange={(e) => setVehicleHireCost(Number(e.target.value))}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Loading Cost</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="loadingCost"
                  value={loadingCost || ""}
                  onChange={(e) => setLoadingCost(Number(e.target.value))}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Unloading Cost</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="unloadingCost"
                  value={unloadingCost || ""}
                  onChange={(e) => setUnloadingCost(Number(e.target.value))}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Other / Toll Cost</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="otherCost"
                  value={otherCost || ""}
                  onChange={(e) => setOtherCost(Number(e.target.value))}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              {/* Live Computed Total Card */}
              <div className="bg-red-50/70 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-100 dark:border-red-900/40 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                  Total Transport Cost
                </span>
                <span className="text-lg font-black text-red-900 dark:text-red-100 mt-0.5">
                  LKR {calculatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Remarks / Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Remarks / Dispatch Notes
            </label>
            <textarea
              name="remarks"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Delivery instructions, gate pass numbers, driver contact numbers..."
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center whitespace-nowrap"
            >
              Cancel
            </button>
            <FormButton loading={loading} fullWidth={false} className="w-52">
              Save Transport Record
            </FormButton>
          </div>
        </form>
      </Modal>

      {/* ── Custom Approval Notice UI Modal ──────────────────────────── */}
      <Modal
        isOpen={Boolean(approvalNotice)}
        onClose={handleNoticeClose}
        title="Admin Approval Required"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                Monthly Cost Threshold Exceeded (LKR 5,000,000)
              </p>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                {approvalNotice}
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <span>The Transport record has been saved, but its actual cost is held in Pending status.</span>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleNoticeClose}
              className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
            >
              Understood / OK
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default LogTransportModal;

