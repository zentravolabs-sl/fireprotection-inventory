"use client";

// ============================================================
// src/app/(Main)/inventory/components/SearchableSupplierSelect.tsx
// Searchable dropdown component to select a Supplier from DB.
// Updated to camelCase properties (id, company, contactPerson).
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Building2, X } from "lucide-react";
import { searchSuppliers, type SupplierRow } from "@/app/(Main)/suppliers/actions";

interface SearchableSupplierSelectProps {
  value?: number | null;
  onChange: (supplierId: number | null) => void;
  disabled?: boolean;
  error?: string;
}

export default function SearchableSupplierSelect({
  value,
  onChange,
  disabled = false,
  error,
}: SearchableSupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      searchSuppliers(searchQuery)
        .then((res) => {
          if (isMounted) setSuppliers(res);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSupplier = suppliers.find((s) => s.id === value);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between pl-3 pr-3 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white
          disabled:opacity-60 disabled:cursor-not-allowed
          ${
            error
              ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 size={15} className="text-gray-400 flex-shrink-0" />
          <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>
            {selectedSupplier ? selectedSupplier.company : value ? `Supplier #${value}` : "Select Supplier (Optional)"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              title="Clear selection"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className="text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 pb-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search supplier..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400 text-gray-900 bg-white"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 text-sm">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                !value ? "bg-red-50/50 text-red-600 font-medium" : "text-gray-600"
              }`}
            >
              <span>None (No Supplier)</span>
              {!value && <Check size={14} className="text-red-600" />}
            </button>

            {loading ? (
              <div className="px-3 py-4 text-xs text-center text-gray-400">Loading suppliers...</div>
            ) : suppliers.length === 0 ? (
              <div className="px-3 py-4 text-xs text-center text-gray-400">No suppliers found.</div>
            ) : (
              suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => {
                    onChange(supplier.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    value === supplier.id ? "bg-red-50/50 text-red-600 font-medium" : "text-gray-800"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{supplier.company}</span>
                    {supplier.contactPerson && (
                      <span className="text-xs text-gray-400">{supplier.contactPerson}</span>
                    )}
                  </div>
                  {value === supplier.id && <Check size={14} className="text-red-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
