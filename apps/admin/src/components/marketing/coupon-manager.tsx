"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Ticket, Trash2, Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@pos/shared";
import { createCoupon, deleteCoupon, toggleCoupon } from "@/actions/coupon-actions";
import { PageHeader } from "@/components/shared/page-header";

const TYPE_LABELS: Record<string, string> = {
  FIXED_DISCOUNT: "满减券", PERCENTAGE: "折扣券",
  FREE_DELIVERY: "免配送费", FREE_ITEM: "兑换券",
};

type Props = { coupons: any[]; storeId: string };

export function CouponManager({ coupons: initCoupons, storeId }: Props) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initCoupons);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "FIXED_DISCOUNT", value: 10, minSpend: 0,
    usageLimit: 100, startDate: "", endDate: "",
  });

  async function handleCreate() {
    if (!form.code.trim() || !form.startDate || !form.endDate) return;
    await createCoupon({ storeId, ...form });
    setShowForm(false);
    setForm({ code: "", type: "FIXED_DISCOUNT", value: 10, minSpend: 0, usageLimit: 100, startDate: "", endDate: "" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteCoupon(id);
    setCoupons(coupons.filter((c) => c.id !== id));
    router.refresh();
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleCoupon(id, active);
    setCoupons(coupons.map((c) => c.id === id ? { ...c, isActive: active } : c));
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 inline mr-1" /> 新建优惠券
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className={cn("bg-white rounded-xl border p-5", !c.isActive && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                {TYPE_LABELS[c.type] || c.type}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggle(c.id, !c.isActive)} className={cn("p-1 rounded", c.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100")}>
                  {c.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-blue-600 mb-1">
              {c.type === "PERCENTAGE" ? c.value + "折" : c.type === "FREE_DELIVERY" ? "免配送" : "减" + formatCurrency(c.value)}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              满{formatCurrency(c.minSpend)}可用 · <code className="bg-gray-100 px-1 rounded">{c.code}</code>
            </p>
            {c.customer && (
              <p className="text-xs text-gray-400 mb-2">持有人: {c.customer.name || c.customer.phone}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{c.usedCount}/{c.usageLimit} 已用</span>
              <span>{new Date(c.startDate).toLocaleDateString("zh-CN")} ~ {new Date(c.endDate).toLocaleDateString("zh-CN")}</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: Math.min(100, (c.usedCount / c.usageLimit) * 100) + "%" }} />
            </div>
            {!c.customer && (
              <button
                onClick={() => {
                  const phone = prompt("输入客户手机号以发券:");
                  if (phone) {
                    fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ couponId: c.id, customerId: phone }) })
                      .then(() => router.refresh());
                  }
                }}
                className="w-full text-xs text-blue-600 border border-blue-200 rounded py-1 hover:bg-blue-50"
              >
                发券给客户
              </button>
            )}
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">暂无优惠券，点击"新建优惠券"创建</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-4">新建优惠券</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">券码</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如: SUMMER2024" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="FIXED_DISCOUNT">满减券</option>
                  <option value="PERCENTAGE">折扣券</option>
                  <option value="FREE_DELIVERY">免配送费</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">面值/折扣</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">最低消费</label>
                  <input type="number" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">开始日期</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束日期</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
