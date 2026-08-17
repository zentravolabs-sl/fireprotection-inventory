"use client";

// ============================================================
// src/components/users/user-filters.tsx
// Search + Role + Status filters for the user list page.
// Uses URL search params for server-driven filtering.
// ============================================================

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "ENGINEER", label: "Engineer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "USER", label: "User" },
] as const;

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
] as const;

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

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a657a] pointer-events-none"
        />
        <input
          id="user-search"
          type="search"
          placeholder="Search by name, email, employee code…"
          defaultValue={search}
          onChange={(e) => updateParams("search", e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-[#0F1524] border border-[#1e2a3d] rounded-xl text-sm text-[#dce3ef] placeholder-[#5a657a] focus:outline-none focus:border-[#e02424]/60 focus:ring-1 focus:ring-[#e02424]/20 transition-all"
          aria-label="Search users"
        />
      </div>

      {/* Role filter */}
      <select
        id="user-role-filter"
        value={role}
        onChange={(e) => updateParams("role", e.target.value)}
        className="h-10 px-3 bg-[#0F1524] border border-[#1e2a3d] rounded-xl text-sm text-[#dce3ef] focus:outline-none focus:border-[#e02424]/60 focus:ring-1 focus:ring-[#e02424]/20 transition-all cursor-pointer"
        aria-label="Filter by role"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        id="user-status-filter"
        value={isActive}
        onChange={(e) => updateParams("isActive", e.target.value)}
        className="h-10 px-3 bg-[#0F1524] border border-[#1e2a3d] rounded-xl text-sm text-[#dce3ef] focus:outline-none focus:border-[#e02424]/60 focus:ring-1 focus:ring-[#e02424]/20 transition-all cursor-pointer"
        aria-label="Filter by status"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-[#5a657a] hover:text-[#dce3ef] border border-[#1e2a3d] rounded-xl transition-colors hover:border-[#2a3a52] disabled:opacity-50"
          aria-label="Clear all filters"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
