"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@pos/shared";

type Customer = {
  id: string; name: string | null; phone: string | null;
  credits: { id: string; type: string; amount: number; note: string | null; createdAt: Date }[];
  _count: { orders: number };
};

type Props = { customers: Customer[]; storeId: string };

export function CreditManager({ customers, storeId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: "", amount: 0, note: "" });

  const getBalance = (c: Customer) => c.credits.reduce((s: number, cr) => {
    if (cr.type === "GRANT" || cr.type === "SPEND") return s + cr.amount;
    if (cr.type === "REPAY") return s - cr.amount;
    return s;
  }, 0);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name && c.name.includes(q)) || (c.phone && c.phone.includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户姓名/电话..."
          className="w-64 px-3 py-2 border rounded-lg text-sm"
        />
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
          <Plus className="w-4 h-4" /> 新建挂账
        </button>
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">客户</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">消费次数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">挂账余额</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">最近挂账</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => {
              const balance = getBalance(c);
              const lastCredit = c.credits[0];
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{c.name || "未命名"}</p>
                    <p className="text-xs text-gray-400">{c.phone || "--"}</p>
                  </td>
                  <td className="py-3 px-4 text-right">{c._count.orders}</td>
                  <td className={cn("py-3 px-4 text-right font-medium", balance > 0 ? "text-red-600" : "text-green-600")}>
                    {formatCurrency(balance)}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {lastCredit ? `${lastCredit.type === "GRANT" ? "授信" : "还款"} ${formatCurrency(lastCredit.amount)} · ${new Date(lastCredit.createdAt).toLocaleDateString("zh-CN")}` : "--"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Credit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">新建挂账</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">客户</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">选择客户</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.phone || "未命名"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">金额</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">创建挂账</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
