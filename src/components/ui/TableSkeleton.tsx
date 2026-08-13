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
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3.5">
                  <div
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                    style={{ width: colIdx === 0 ? "2rem" : colIdx === cols - 1 ? "5rem" : "100%" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
