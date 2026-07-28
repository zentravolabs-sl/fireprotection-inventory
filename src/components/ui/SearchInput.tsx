"use client";

// ============================================================
// src/components/ui/SearchInput.tsx
// Debounced search input that syncs with URL search params.
// Waits 400ms after the user stops typing before navigating.
// ============================================================

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  /** The URL search param key to update, defaults to "search" */
  paramKey?: string;
  defaultValue?: string;
  /** Debounce delay in ms, defaults to 400 */
  debounceMs?: number;
}

export default function SearchInput({
  placeholder = "Search…",
  paramKey = "search",
  defaultValue = "",
  debounceMs = 400,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(defaultValue);

  // Holds the debounce timer reference across renders
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
      // Reset to page 1 on new search
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, paramKey],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Schedule the URL update after the debounce delay
    timerRef.current = setTimeout(() => {
      updateSearch(value);
    }, debounceMs);
  };

  const handleClear = () => {
    // Cancel any pending debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    setInputValue("");
    updateSearch("");
  };

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        id={`search-input-${paramKey}`}
        type="search"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm
          placeholder:text-gray-400 text-gray-900 outline-none
          focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
      />
      {/* Clear button — shown when there is text */}
      {inputValue && !isPending && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
      {/* Spinner shown while URL navigation is in flight */}
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
