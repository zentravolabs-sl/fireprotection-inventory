"use client";

// ============================================================
// src/components/users/user-filters.tsx
// Search + Role + Status filters for the user list page.
// Uses URL search params for server-driven filtering.
// ============================================================

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "CEO", label: "CEO" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "QS_ENGINEER", label: "QS Engineer" },
  { value: "PURCHASE_ENGINEER", label: "Purchase Engineer" },
  { value: "INVENTORY_CONTROLLER", label: "Inventory Controller" },
  { value: "ENGINEER", label: "Engineer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "USER", label: "User" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export default function UserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";
  const isActive = searchParams.get("isActive") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset page on filter change
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  const hasFilters = search || role || isActive;

  const selectedRoleOption = ROLES.find((r) => r.value === role) || ROLES[0];
  const selectedStatusOption = STATUSES.find((s) => s.value === isActive) || STATUSES[0];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          id="user-search"
          type="search"
          placeholder="Search by name, email, employee code…"
          defaultValue={search}
          onChange={(e) => updateParams("search", e.target.value)}
          className="w-full h-[40px] pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          aria-label="Search users"
        />
      </div>

      {/* Role filter */}
      <div className="w-full sm:w-52">
        <Select
          instanceId="user-role-filter"
          classNamePrefix="react-select"
          options={ROLES}
          value={selectedRoleOption}
          onChange={(val) => updateParams("role", val ? val.value : "")}
          isSearchable={false}
          styles={getCustomSelectStyles(false, "40px")}
        />
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-44">
        <Select
          instanceId="user-status-filter"
          classNamePrefix="react-select"
          options={STATUSES}
          value={selectedStatusOption}
          onChange={(val) => updateParams("isActive", val ? val.value : "")}
          isSearchable={false}
          styles={getCustomSelectStyles(false, "40px")}
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 h-[40px] px-3.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          aria-label="Clear all filters"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}

