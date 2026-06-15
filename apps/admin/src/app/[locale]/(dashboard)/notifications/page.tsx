"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Bell, CheckCheck } from "lucide-react";

const TYPE_ICONS: Record<string, string> = { new_order: "🛒", low_stock: "⚠️", system: "ℹ️" };

export default function NotificationsPage() {
  const [data, setData] = useState<any>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setData({ ...data, unreadCount: 0, notifications: data.notifications.map((n: any) => ({ ...n, isRead: true })) });
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setData({ ...data, unreadCount: Math.max(0, data.unreadCount - 1), notifications: data.notifications.map((n: any) => n.id === id ? { ...n, isRead: true } : n) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="通知中心" description={data.unreadCount + " 条未读"} />
        {data.unreadCount > 0 && <button onClick={markAll} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"><CheckCheck className="w-4 h-4 inline mr-1" />全部已读</button>}
      </div>

      <div className="space-y-2">
        {data.notifications.map((n: any) => (
          <div key={n.id} onClick={() => !n.isRead && markOne(n.id)} className={"bg-white rounded-xl border p-4 cursor-pointer " + (!n.isRead ? "border-blue-300 bg-blue-50" : "")}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{TYPE_ICONS[n.type] || "ℹ️"}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.title}</span>
                  {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("zh-CN")}</p>
              </div>
            </div>
          </div>
        ))}
        {!loading && data.notifications.length === 0 && <div className="text-center py-12 text-gray-400"><Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />暂无通知</div>}
      </div>
    </div>
  );
}
