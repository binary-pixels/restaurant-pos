"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Search, Crown, Star, Wallet, Gift, TrendingUp, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, MEMBER_TIER_MAP } from "@pos/shared";
import { topUpBalance, adjustPoints, updateCustomerTier, createCustomer } from "@/actions/customer-actions";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  REGULAR: "bg-gray-100 text-gray-600",
  SILVER: "bg-slate-200 text-slate-700",
  GOLD: "bg-amber-100 text-amber-700",
  DIAMOND: "bg-purple-100 text-purple-700",
};

type Customer = {
  id: string; name: string | null; phone: string | null; points: number; balance: number;
  totalSpent: number; visitCount: number; tier: string; lastVisitAt: Date | null;
  _count: { orders: number };
};

type Props = { customers: Customer[]; stats: { total: number; gold: number; totalPoints: number; totalBalance: number }; storeId: string };

export function MemberList({ customers: initCusts, stats, storeId }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const [customers, setCustomers] = useState(initCusts);
  const [search, setSearch] = useState("");

  // Top-up modal
  const [topUp, setTopUp] = useState<{ customer: Customer; amount: number } | null>(null);
  // Points modal
  const [pointsModal, setPointsModal] = useState<{ customer: Customer; amount: number } | null>(null);
  // New customer modal
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", phone: "" });
  // Tier edit
  const [editingTier, setEditingTier] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name?.toLowerCase().includes(q)) || (c.phone?.includes(q));
  });

  async function handleTopUp() {
    if (!topUp || topUp.amount <= 0) return;
    await topUpBalance(topUp.customer.id, topUp.amount);
    setTopUp(null);
    router.refresh();
  }

  async function handleAdjustPoints() {
    if (!pointsModal) return;
    await adjustPoints(pointsModal.customer.id, pointsModal.amount);
    setPointsModal(null);
    router.refresh();
  }

  async function handleTierChange(customerId: string, tier: string) {
    await updateCustomerTier(customerId, tier);
    setCustomers(customers.map((c) => c.id === customerId ? { ...c, tier } : c));
    setEditingTier(null);
    router.refresh();
  }

  async function handleCreateCustomer() {
    if (!newForm.name || !newForm.phone) return;
    await createCustomer({ storeId, name: newForm.name, phone: newForm.phone });
    setShowNew(false);
    setNewForm({ name: "", phone: "" });
    router.refresh();
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "会员总数", value: stats.total, icon: Users_t, color: "bg-blue-500" },
          { label: "金钻会员", value: stats.gold, icon: Crown, color: "bg-amber-500" },
          { label: "总积分", value: stats.totalPoints.toLocaleString(), icon: Gift, color: "bg-green-500" },
          { label: "储值余额", value: formatCurrency(stats.totalBalance), icon: Wallet, color: "bg-purple-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className={cn(s.color, "p-2.5 rounded-lg")}><s.icon className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索姓名/手机号..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 inline mr-1" /> 添加会员
        </button>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">会员</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">等级</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">积分</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">余额</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">累计消费</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">消费次数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Link href={`/${locale}/marketing/members/${c.id}`} className="hover:text-blue-600">
                    <p className="font-medium text-gray-900">{c.name || "未命名"}</p>
                    <p className="text-xs text-gray-400">{c.phone || "--"}</p>
                  </Link>
                </td>
                <td className="py-3 px-4">
                  {editingTier === c.id ? (
                    <select defaultValue={c.tier} onChange={(e) => handleTierChange(c.id, e.target.value)} onBlur={() => setEditingTier(null)} autoFocus className="text-xs border rounded px-1 py-0.5">
                      <option value="REGULAR">普通会员</option>
                      <option value="SILVER">银卡会员</option>
                      <option value="GOLD">金卡会员</option>
                      <option value="DIAMOND">钻石会员</option>
                    </select>
                  ) : (
                    <button onClick={() => setEditingTier(c.id)} className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1", TIER_COLORS[c.tier] || TIER_COLORS.REGULAR)}>
                      {c.tier === "GOLD" || c.tier === "DIAMOND" ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                      {MEMBER_TIER_MAP[c.tier as keyof typeof MEMBER_TIER_MAP]?.label || c.tier}
                      <Edit2 className="w-3 h-3 opacity-50" />
                    </button>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-medium">{c.points.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(c.balance)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(c.totalSpent)}</td>
                <td className="py-3 px-4 text-right">{c._count.orders} 次</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setTopUp({ customer: c, amount: 100 })} className="px-2 py-1 text-xs border rounded hover:bg-green-50 hover:text-green-600 hover:border-green-300 flex items-center gap-0.5">
                      <Wallet className="w-3 h-3" /> 充值
                    </button>
                    <button onClick={() => setPointsModal({ customer: c, amount: 100 })} className="px-2 py-1 text-xs border rounded hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 flex items-center gap-0.5">
                      <Gift className="w-3 h-3" /> 积分
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">暂无会员</div>}
      </div>

      {/* Top-up Modal */}
      {topUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setTopUp(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-2">余额充值</h3>
            <p className="text-sm text-gray-500 mb-4">{topUp.customer.name} · 余额 {formatCurrency(topUp.customer.balance)}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                <button key={amt} onClick={() => setTopUp({ ...topUp, amount: amt })}
                  className={cn("py-2 text-sm border rounded-lg", topUp.amount === amt ? "border-blue-600 bg-blue-50 text-blue-600" : "hover:bg-gray-50")}
                >¥{amt}</button>
              ))}
            </div>
            <input type="number" value={topUp.amount} onChange={(e) => setTopUp({ ...topUp, amount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setTopUp(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleTopUp} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg">确认充值</button>
            </div>
          </div>
        </div>
      )}

      {/* Points Modal */}
      {pointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setPointsModal(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">积分调整</h3>
            <p className="text-sm text-gray-500 mb-4">{pointsModal.customer.name} · 当前 {pointsModal.customer.points} 积分</p>
            <input type="number" value={pointsModal.amount} onChange={(e) => setPointsModal({ ...pointsModal, amount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPointsModal(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleAdjustPoints} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg">确认调整</button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNew(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">添加会员</h3>
            <div className="space-y-3">
              <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="姓名" className="w-full px-3 py-2 border rounded-lg" />
              <input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} placeholder="手机号" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleCreateCustomer} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Alias for Users icon
const Users_t = ({ className }: any) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
