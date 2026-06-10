"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "border-yellow-300 bg-yellow-50",
  CONFIRMED: "border-blue-300 bg-blue-50",
  PREPARING: "border-orange-300 bg-orange-50",
  SERVED: "border-green-300 bg-green-50",
};

const ITEM_STATUS: Record<string, string> = {
  PENDING: "待做",
  PREPARING: "制作中",
  SERVED: "已出餐",
  CANCELLED: "已取消",
};

type Props = { orders: any[] };

export function KitchenDisplay({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">暂无订单</p>
        <p className="text-sm mt-1">新订单将自动显示在这里</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className={cn(
            "rounded-xl border-2 p-4",
            STATUS_COLOR[order.status] || "border-gray-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-lg text-gray-900">
                {order.table?.label || order.type === "TAKEOUT" ? "自取" : "配送"}
              </p>
              <p className="text-xs text-gray-500">{order.orderNo}</p>
            </div>
            <span
              className={cn("text-xs px-2 py-0.5 rounded-full font-medium", {
                "bg-yellow-100 text-yellow-700": order.status === "PENDING",
                "bg-blue-100 text-blue-700": order.status === "CONFIRMED",
                "bg-orange-100 text-orange-700": order.status === "PREPARING",
                "bg-green-100 text-green-700": order.status === "SERVED",
              })}
            >
              {order.status === "PENDING" && "待确认"}
              {order.status === "CONFIRMED" && "已确认"}
              {order.status === "PREPARING" && "制作中"}
              {order.status === "SERVED" && "已上菜"}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {item.productName}
                  </span>
                  <span className="text-gray-400">×{item.quantity}</span>
                </div>
                <button
                  onClick={async () => {
                    if (item.status === "SERVED") return;
                    await fetch("/api/kitchen/items", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ itemId: item.id }),
                    });
                    // Refresh after brief delay
                    setTimeout(() => window.location.reload(), 300);
                  }}
                  className={cn("text-xs px-1.5 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-blue-300", {
                    "bg-yellow-100 text-yellow-600": item.status === "PENDING",
                    "bg-orange-100 text-orange-600": item.status === "PREPARING",
                    "bg-green-100 text-green-600": item.status === "SERVED",
                    "bg-gray-100 text-gray-400": item.status === "CANCELLED",
                  })}
                >
                  {ITEM_STATUS[item.status] || item.status}
                  {item.status !== "SERVED" && item.status !== "CANCELLED" && " ▸"}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>{order.items.length} 道菜</span>
            <ElapsedBadge createdAt={order.createdAt} />
            {order.note && <span className="truncate ml-2">备注: {order.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) setElapsed("刚刚");
      else if (mins < 60) setElapsed(mins + "分钟前");
      else {
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        setElapsed(hrs + "小时" + (rem > 0 ? rem + "分" : "") + "前");
      }
    }
    update();
    const timer = setInterval(update, 30000); // update every 30s
    return () => clearInterval(timer);
  }, [createdAt]);

  return (
    <span className={elapsed.includes("分钟") && parseInt(elapsed) > 15 ? "text-red-500 font-medium" : ""}>
      ⏱ {elapsed}
    </span>
  );
}
