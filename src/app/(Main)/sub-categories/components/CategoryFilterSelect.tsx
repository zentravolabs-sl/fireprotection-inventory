"use client";

// ============================================================
// src/app/(Main)/sub-categories/components/CategoryFilterSelect.tsx
// Client component dropdown that updates the categoryId URL param.
// Uses react-select for a richer UI experience.
// ============================================================

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Props as SelectProps } from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";

// Disable SSR to prevent Emotion CSS hydration mismatches with react-select.
// Cast via `as` so TypeScript preserves react-select's generic signature.
const Select = dynamic(() => import("react-select"), {
  ssr: false,
}) as ComponentType<SelectProps<Option, false>>;

interface CategoryFilterSelectProps {
  categories: { id: number; categoryName: string }[];
  currentCategoryId?: number;
}

type Option = { value: number; label: string };

export default function CategoryFilterSelect({
  categories,
  currentCategoryId,
}: CategoryFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options: Option[] = categories.map((cat) => ({
    value: cat.id,
    label: cat.categoryName,
  }));

  const selected = options.find((o) => o.value === currentCategoryId) ?? null;

  const handleChange = (option: Option | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (option) {
      params.set("categoryId", String(option.value));
    } else {
      params.delete("categoryId");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      instanceId="category-filter-select"
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder="All Categories"
      isClearable
      isSearchable
      menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
      styles={getCustomSelectStyles(false, "42px")}
    />
  );
}
