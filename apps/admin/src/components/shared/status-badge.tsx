import { cn } from "@/lib/utils";

type StatusMap = Record<string, { label: string; color: string }>;

type Props = {
  status: string;
  statusMap: StatusMap;
  size?: "sm" | "md" | "lg";
};

export function StatusBadge({ status, statusMap, size = "md" }: Props) {
  const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        info.color,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-0.5 text-sm",
        size === "lg" && "px-3 py-1 text-base"
      )}
    >
      {info.label}
    </span>
  );
}
