"use client";

// ============================================================
// src/app/(Main)/admin/sub-categories/components/CategoryFilterSelect.tsx
// Client component dropdown that updates the categoryId URL param.
// ============================================================

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface CategoryFilterSelectProps {
  categories: { id: number; categoryName: string }[];
  currentCategoryId?: number;
}

export default function CategoryFilterSelect({
  categories,
  currentCategoryId,
}: CategoryFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("categoryId", e.target.value);
    } else {
      params.delete("categoryId");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      id="category-filter"
      value={currentCategoryId ? String(currentCategoryId) : ""}
      onChange={handleChange}
      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm
        text-gray-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400
        transition-all appearance-none cursor-pointer"
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat.id} value={String(cat.id)}>
          {cat.categoryName}
        </option>
      ))}
    </select>
  );
}
