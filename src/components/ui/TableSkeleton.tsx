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
        <tr key={rowIdx} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-6 py-4">
              <div
                className="h-4 bg-gray-100 rounded-full animate-pulse"
                style={{ width: colIdx === 0 ? "2rem" : colIdx === cols - 1 ? "5rem" : "100%" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
