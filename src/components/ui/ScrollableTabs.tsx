"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Layers, ListFilter } from "lucide-react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  category?: string;
}

interface ScrollableTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  categories?: { id: string; label: string }[];
  className?: string;
}

export function ScrollableTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  categories,
  className = "",
}: ScrollableTabsProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Check scroll bounds to conditionally show left/right arrow buttons & edge fades
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleResize = () => checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [checkScroll, tabs, selectedCategory]);

  // Scroll active tab into view whenever activeTab changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  // Scroll by step on arrow button click
  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.7, 200);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Convert mouse vertical scroll wheel into horizontal scroll over tab bar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // Only intercept if content is actually scrollable
    if (el.scrollWidth > el.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
      }
    }
  };

  // Filter tabs by category if categories are enabled
  const filteredTabs =
    selectedCategory === "all" || !categories
      ? tabs
      : tabs.filter((t) => t.category === selectedCategory);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Category Pills & Mobile Select Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Optional Category Pills */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <ListFilter size={12} /> Filter:
            </span>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === "all"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All ({tabs.length})
            </button>
            {categories.map((cat) => {
              const catCount = tabs.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat.label} ({catCount})
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Quick Dropdown Selector */}
        <div className="w-full sm:hidden flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <Layers size={15} className="text-red-600 ml-1 flex-shrink-0" />
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as T)}
            className="w-full bg-transparent text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer py-1"
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Scrollable Tab Strip Container */}
      <div className="relative group border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 rounded-t-xl px-1">
        {/* Left Scroll Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll tabs left"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Right Scroll Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll tabs right"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Left Gradient Overflow Mask */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none rounded-l-xl" />
        )}

        {/* Right Gradient Overflow Mask */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none rounded-r-xl" />
        )}

        {/* Scrollable Tab Strip */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-2 no-scrollbar text-xs font-semibold select-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {filteredTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => onTabChange(tab.id)}
                className={`relative group/tab flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 shadow-sm font-bold"
                    : "bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>

                {/* Optional Badge Pill */}
                {typeof tab.count === "number" && (
                  <span
                    className={`ml-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                      isActive
                        ? "bg-red-600 dark:bg-red-500 text-white"
                        : "bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover/tab:bg-gray-300 dark:group-hover/tab:bg-gray-700 group-hover/tab:text-gray-900 dark:group-hover/tab:text-gray-100"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {/* Active Highlight Line at Bottom */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-600 dark:bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
