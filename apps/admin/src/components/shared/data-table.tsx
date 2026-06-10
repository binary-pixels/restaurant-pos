import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyState,
  onRowClick,
}: Props<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        加载中...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        {emptyState || "暂无数据"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "text-left py-3 px-4 font-medium text-gray-500",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-gray-100",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("py-3 px-4 text-gray-900", col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
