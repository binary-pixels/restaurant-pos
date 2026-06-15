"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CheckCircle, XCircle } from "lucide-react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations || []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/reservations", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setReservations(reservations.map((r) => r.id === id ? { ...r, status } : r));
  }

  return (
    <div>
      <PageHeader title="预订管理" description={reservations.length + " 条预订"} />
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4">姓名</th>
              <th className="text-left py-3 px-4">手机</th>
              <th className="text-left py-3 px-4">日期</th>
              <th className="text-left py-3 px-4">时段</th>
              <th className="text-left py-3 px-4">桌台</th>
              <th className="text-right py-3 px-4">人数</th>
              <th className="text-left py-3 px-4">状态</th>
              <th className="text-right py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{r.name}</td>
                <td className="py-3 px-4 text-gray-500">{r.phone}</td>
                <td className="py-3 px-4">{r.date}</td>
                <td className="py-3 px-4">{r.timeSlot}</td>
                <td className="py-3 px-4">{r.tableLabel}</td>
                <td className="py-3 px-4 text-right">{r.guests}人</td>
                <td className="py-3 px-4">
                  <span className={"text-xs px-2 py-0.5 rounded " + (r.status === "CONFIRMED" ? "bg-green-100 text-green-700" : r.status === "CANCELLED" ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700")}>
                    {r.status === "CONFIRMED" ? "已确认" : r.status === "CANCELLED" ? "已取消" : "待确认"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {r.status === "PENDING" && (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => updateStatus(r.id, "CONFIRMED")} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => updateStatus(r.id, "CANCELLED")} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
