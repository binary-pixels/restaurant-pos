"use client";

import { DollarSign, ShoppingCart, CreditCard, Users, Wallet, Banknote, Smartphone, RotateCcw, TrendingUp } from "lucide-react";
import { formatCurrency } from "@pos/shared";
import { cn } from "@/lib/utils";

const METHODS: Record<string, { label: string; icon: any; color: string }> = {
  CASH: { label: "现金", icon: Banknote, color: "bg-green-500" },
  WECHAT_QR: { label: "微信支付", icon: Smartphone, color: "bg-emerald-500" },
  ALIPAY_QR: { label: "支付宝", icon: Smartphone, color: "bg-blue-500" },
  CARD: { label: "银行卡", icon: CreditCard, color: "bg-purple-500" },
  MEMBER_BALANCE: { label: "会员余额", icon: Wallet, color: "bg-amber-500" },
};

type Props = {
  methodTotals: Record<string, number>;
  totalRevenue: number;
  orderCount: number;
  totalDebt: number;
  totalRefund: number;
  totalCustomerBalance: number;
};

export function FinanceDashboard({ methodTotals, totalRevenue, orderCount, totalDebt, totalRefund, totalCustomerBalance }: Props) {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: "今日营收", value: formatCurrency(totalRevenue), icon: DollarSign, color: "bg-blue-500" },
          { label: "今日退款", value: formatCurrency(totalRefund), icon: RotateCcw, color: "bg-orange-500" },
          { label: "净收入", value: formatCurrency(totalRevenue - totalRefund), icon: TrendingUp, color: "bg-green-500" },
          { label: "今日订单", value: String(orderCount), icon: ShoppingCart, color: "bg-indigo-500" },
          { label: "挂账总额", value: formatCurrency(totalDebt), icon: CreditCard, color: "bg-red-500" },
          { label: "会员余额池", value: formatCurrency(totalCustomerBalance), icon: Wallet, color: "bg-purple-500" },
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

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">支付渠道分布</h3>
        {Object.keys(methodTotals).length === 0 ? (
          <p className="text-gray-400 text-center py-8">今日暂无收款</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(methodTotals).map(([method, amount]) => {
              const pct = totalRevenue > 0 ? (amount / totalRevenue * 100).toFixed(1) : "0";
              const info = METHODS[method] || { label: method, icon: DollarSign, color: "bg-gray-400" };
              return (
                <div key={method} className="flex items-center gap-3">
                  <info.icon className="w-5 h-5 text-gray-500" />
                  <span className="w-20 text-sm">{info.label}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", info.color)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 text-right text-sm font-medium">{formatCurrency(amount)}</span>
                  <span className="w-12 text-right text-xs text-gray-400">{pct}%</span>
                </div>
              );
            })}
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>合计</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Receipt */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">手动收款</h3>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">金额</label>
            <input type="number" step="0.01" placeholder="0.00" className="w-40 px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">方式</label>
            <select className="px-3 py-2 border rounded-lg">
              <option value="CASH">现金</option>
              <option value="WECHAT_QR">微信支付</option>
              <option value="ALIPAY_QR">支付宝</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">备注</label>
            <input placeholder="收款说明" className="w-48 px-3 py-2 border rounded-lg" />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">提交收款</button>
        </div>
      </div>
    </div>
  );
}
