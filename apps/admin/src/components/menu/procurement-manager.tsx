"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle, Clock, Truck, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@pos/shared";
import { createProcurement, updateProcurementStatus, deleteProcurement } from "@/actions/procurement-actions";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "待采购", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  ORDERED: { label: "已下单", color: "bg-blue-100 text-blue-700", icon: Truck },
  RECEIVED: { label: "已入库", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

type Props = { orders: any[]; storeId: string };

export function ProcurementManager({ orders: initOrders, storeId }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState(initOrders);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier: "",
    items: [{ productName: "", quantity: 1, unitCost: 0 }],
  });

  const filtered = orders.filter((o) => {
    if (!search) return true;
    return o.supplier.includes(search) || o.id.slice(-6).includes(search);
  });

  const total = orders.reduce((s, o) => s + o.totalCost, 0);

  async function handleCreate() {
    if (!form.supplier.trim() || form.items.length === 0) return;
    await createProcurement({ storeId, supplier: form.supplier, items: form.items, note: "" });
    setShowForm(false);
    setForm({ supplier: "", items: [{ productName: "", quantity: 1, unitCost: 0 }] });
    router.refresh();
  }

  async function handleReceive(id: string) {
    await updateProcurementStatus(id, "RECEIVED");
    setOrders(orders.map((o) => o.id === id ? { ...o, status: "RECEIVED" } : o));
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteProcurement(id);
    setOrders(orders.filter((o) => o.id !== id));
    router.refresh();
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">采购总额</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">待收货</p>
          <p className="text-2xl font-bold text-gray-900">{orders.filter((o) => o.status !== "RECEIVED").length} 单</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">已入库</p>
          <p className="text-2xl font-bold text-gray-900">{orders.filter((o) => o.status === "RECEIVED").length} 单</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索供应商..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 inline mr-1" /> 新建采购单
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">供应商</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">品项</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">金额</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">日期</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((o) => {
              const s = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{o.supplier}</td>
                  <td className="py-3 px-4">
                    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", s.color)}>
                      <s.icon className="w-3 h-3" /> {s.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{o.items?.length || 0} 项</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(o.totalCost)}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="py-3 px-4 text-right">
                    {o.status !== "RECEIVED" && (
                      <button onClick={() => handleReceive(o.id)} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 mr-1">确认收货</button>
                    )}
                    <button onClick={() => handleDelete(o.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">暂无采购单</div>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg z-10 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">新建采购单</h3>
            <div className="space-y-3">
              <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">选择供应商</option>
                <option value="华联食材批发">华联食材批发</option>
                <option value="鲜达供应链">鲜达供应链</option>
                <option value="海吉星农贸">海吉星农贸</option>
              </select>
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={item.productName} onChange={(e) => { const items = [...form.items]; items[i].productName = e.target.value; setForm({ ...form, items }); }} placeholder="品名" className="flex-1 px-2 py-1.5 border rounded text-sm" />
                  <input type="number" value={item.quantity} onChange={(e) => { const items = [...form.items]; items[i].quantity = Number(e.target.value); setForm({ ...form, items }); }} placeholder="数量" className="w-20 px-2 py-1.5 border rounded text-sm" />
                  <input type="number" step="0.01" value={item.unitCost} onChange={(e) => { const items = [...form.items]; items[i].unitCost = Number(e.target.value); setForm({ ...form, items }); }} placeholder="单价" className="w-24 px-2 py-1.5 border rounded text-sm" />
                  <button onClick={() => { const items = form.items.filter((_, j) => j !== i); setForm({ ...form, items }); }} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setForm({ ...form, items: [...form.items, { productName: "", quantity: 1, unitCost: 0 }] })} className="text-sm text-blue-600"><Plus className="w-3 h-3 inline mr-1" />添加品项</button>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">创建采购单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
