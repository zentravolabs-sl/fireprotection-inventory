// ============================================================
// src/components/ui/TableSkeleton.tsx
// Animated skeleton loader rows for data tables.
// ============================================================

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-800">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3.5">
              <div
                className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"
                style={{ width: colIdx === 0 ? "2rem" : colIdx === cols - 1 ? "5rem" : "100%" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
