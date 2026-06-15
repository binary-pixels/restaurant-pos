"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@pos/shared";

export default function TVPage() {
  const [data, setData] = useState<any>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 15000);
    const clock = setInterval(() => setTime(new Date().toLocaleTimeString("zh-CN")), 1000);
    return () => { clearInterval(timer); clearInterval(clock); };
  }, []);

  function fetchData() {
    fetch("/api/reports?mode=day")
      .then((r) => r.json())
      .then(setData);
  }

  if (!data) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">加载中...</div>;

  const profitRate = data.totalRevenue > 0 ? ((data.totalProfit || 0) / data.totalRevenue * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">好味道餐厅 · 实时数据大屏</h1>
          <p className="text-gray-400 text-xl mt-1">{new Date().toLocaleDateString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-blue-300 font-mono">{time}</div>
          <p className="text-gray-500 text-lg">每 15 秒自动刷新</p>
        </div>
      </div>

      {/* Big Metric Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "今日营收", value: formatCurrency(data.totalRevenue), icon: DollarSign, color: "bg-blue-600" },
          { label: "订单数", value: data.totalOrders, icon: ShoppingCart, color: "bg-green-600" },
          { label: "利润率", value: profitRate + "%", icon: TrendingUp, color: "bg-emerald-600" },
          { label: "人均", value: formatCurrency(data.avgOrderValue), icon: Users, color: "bg-purple-600" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-6 flex items-center gap-4`}>
            <s.icon className="w-12 h-12 opacity-80" />
            <div>
              <p className="text-lg opacity-80">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Payment methods */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">支付渠道</h2>
          <div className="space-y-3">
            {Object.entries(data.methodTotals || {}).map(([k, v]) => {
              const pct = ((v as number) / data.totalRevenue * 100).toFixed(0);
              const labels: Record<string, string> = { CASH: "现金", WECHAT_QR: "微信", ALIPAY_QR: "支付宝", CARD: "银行卡", MEMBER_BALANCE: "余额" };
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-16 text-gray-400">{labels[k] || k}</span>
                  <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: pct + "%" }} />
                  </div>
                  <span className="w-32 text-right font-mono">{formatCurrency(v as number)}</span>
                  <span className="w-12 text-right text-gray-500">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">热销 Top 5</h2>
          <div className="space-y-2">
            {(data.topProducts || []).slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-500 w-8">{i + 1}</span>
                  <span className="text-lg">{p.name}</span>
                </div>
                <span className="font-mono text-lg">{formatCurrency(p.revenue)} · {p.quantity}份</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
