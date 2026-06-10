"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Crown, Star, Wallet, Gift, TrendingUp, Calendar, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, MEMBER_TIER_MAP } from "@pos/shared";

const TIER_COLORS: Record<string, string> = {
  REGULAR: "bg-gray-100 text-gray-600", SILVER: "bg-slate-200 text-slate-700",
  GOLD: "bg-amber-100 text-amber-700", DIAMOND: "bg-purple-100 text-purple-700",
};

type Props = { customer: any };

export function MemberDetail({ customer }: Props) {
  const router = useRouter();
  const locale = useLocale();

  const orderCount = customer.orders?.length || 0;
  const totalSpent = customer.totalSpent || 0;
  const avgSpent = orderCount > 0 ? totalSpent / orderCount : 0;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {(customer.name || "?")[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name || "未命名"}</h2>
              <p className="text-gray-500">{customer.phone || "未填写手机号"}</p>
              <span className={cn("inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium", TIER_COLORS[customer.tier] || TIER_COLORS.REGULAR)}>
                {customer.tier === "GOLD" || customer.tier === "DIAMOND" ? <Crown className="w-3 h-3 inline mr-0.5" /> : <Star className="w-3 h-3 inline mr-0.5" />}
                {MEMBER_TIER_MAP[customer.tier as keyof typeof MEMBER_TIER_MAP]?.label || customer.tier}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>注册: {new Date(customer.createdAt).toLocaleDateString("zh-CN")}</p>
            {customer.lastVisitAt && <p>最近: {new Date(customer.lastVisitAt).toLocaleDateString("zh-CN")}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          {[
            { label: "累计消费", value: formatCurrency(totalSpent), icon: TrendingUp, color: "text-blue-600" },
            { label: "积分", value: customer.points.toLocaleString(), icon: Gift, color: "text-amber-600" },
            { label: "余额", value: formatCurrency(customer.balance), icon: Wallet, color: "text-green-600" },
            { label: "消费次数", value: `${customer.visitCount}次`, icon: ShoppingCart, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Credit/Points History */}
      {customer.credits && customer.credits.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b font-semibold">积分/余额记录</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2 px-4 font-medium text-gray-500">类型</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500">金额</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500">备注</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customer.credits.slice(0, 20).map((cr: any) => (
                <tr key={cr.id}>
                  <td className="py-2 px-4">
                    <span className={cn("text-xs px-2 py-0.5 rounded", cr.type === "GRANT" ? "bg-green-100 text-green-700" : cr.type === "REPAY" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                      {cr.type === "GRANT" ? "充值/增加" : cr.type === "REPAY" ? "还款" : cr.type === "SPEND" ? "消费" : cr.type}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right font-medium">¥{cr.amount.toFixed(2)}</td>
                  <td className="py-2 px-4 text-gray-500 text-xs">{cr.note || "--"}</td>
                  <td className="py-2 px-4 text-gray-500 text-xs">{new Date(cr.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order History */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b font-semibold">消费记录 ({customer.orders?.length || 0})</div>
        {!customer.orders || customer.orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">暂无消费记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2 px-4 font-medium text-gray-500">订单号</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500">金额</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500">支付</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customer.orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/${locale}/orders/${order.id}`)}>
                  <td className="py-2 px-4 text-blue-600 font-medium">{order.orderNo}</td>
                  <td className="py-2 px-4 text-right font-medium">{formatCurrency(order.total)}</td>
                  <td className="py-2 px-4">
                    <span className={cn("text-xs", order.isPaid ? "text-green-600" : "text-red-600")}>
                      {order.isPaid ? "已支付" : "未支付"}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
