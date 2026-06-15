"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Users, Loader2, Calendar, TrendingDown, Percent, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatCurrency } from "@pos/shared";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const METHOD_COLORS: Record<string, string> = {
  CASH: "#22c55e", WECHAT_QR: "#3b82f6", ALIPAY_QR: "#f59e0b",
  CARD: "#8b5cf6", MEMBER_BALANCE: "#ec4899",
};
const METHOD_LABELS: Record<string, string> = {
  CASH: "现金", WECHAT_QR: "微信", ALIPAY_QR: "支付宝", CARD: "银行卡", MEMBER_BALANCE: "余额",
};

const MODES = [
  { key: "day", label: "今天", desc: "24小时趋势" },
  { key: "week", label: "本周", desc: "7天趋势" },
  { key: "month", label: "本月", desc: "每日趋势" },
  { key: "year", label: "今年", desc: "每月趋势" },
  { key: "custom", label: "自定义", desc: "自由选择" },
] as const;

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>("day");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(false);

  useEffect(() => {
    setLoading(true);
    let url = `/api/reports?mode=${mode}`;
    if (mode === "custom" && customFrom && customTo) {
      url += `&from=${customFrom}&to=${customTo}`;
    }
    fetch(url).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [mode, customFrom, customTo]);

  const trendLabel = mode === "day" ? "小时营收趋势" : mode === "month" ? "每日营收趋势" : mode === "year" || mode === "custom" ? "每月营收趋势" : "每日营收趋势";

  return (
    <div>
      <PageHeader title="数据报表" />

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); if (m.key === "custom") setShowCustomDate(true); }}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", mode === m.key ? "bg-blue-600 text-white" : "bg-white border hover:border-blue-300")}
            title={m.desc}
          >
            <Calendar className="w-4 h-4 inline mr-1" />{m.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      {mode === "custom" && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl border">
          <span className="text-sm text-gray-500">从</span>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <span className="text-sm text-gray-500">到</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : !data ? null : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: "营业实收", value: formatCurrency(data.totalRevenue), icon: DollarSign, color: "bg-blue-500", prev: data.prevRevenue, key: "revenue" },
              { label: "毛利润", value: formatCurrency(data.totalProfit || 0), icon: TrendingUp, color: "bg-green-500", prev: null, key: "profit" },
              { label: "利润率", value: (data.totalRevenue > 0 ? ((data.totalProfit || 0) / data.totalRevenue * 100).toFixed(1) : "0") + "%", icon: Percent, color: "bg-emerald-500", prev: null, key: "rate" },
              { label: "订单数", value: String(data.totalOrders), icon: ShoppingCart, color: "bg-indigo-500", prev: data.prevOrders, key: "orders" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(s.color, "p-2.5 rounded-lg")}><s.icon className="w-5 h-5 text-white" /></div>
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    {s.prev != null && s.prev > 0 && s.key === "revenue" && (
                      <p className="text-xs flex items-center gap-0.5 mt-0.5">
                        {data.totalRevenue > s.prev ? <ArrowUp className="w-3 h-3 text-green-500" /> : data.totalRevenue < s.prev ? <ArrowDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={data.totalRevenue >= s.prev ? "text-green-600" : "text-red-600"}>
                          {s.prev > 0 ? ((data.totalRevenue - s.prev) / s.prev * 100).toFixed(0) : "0"}%
                        </span>
                        <span className="text-gray-400 ml-1">环比</span>
                      </p>
                    )}
                    {s.prev != null && s.prev > 0 && s.key === "orders" && (
                      <p className="text-xs flex items-center gap-0.5 mt-0.5">
                        {data.totalOrders > s.prev ? <ArrowUp className="w-3 h-3 text-green-500" /> : data.totalOrders < s.prev ? <ArrowDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={data.totalOrders >= s.prev ? "text-green-600" : "text-red-600"}>
                          {s.prev > 0 ? ((data.totalOrders - s.prev) / s.prev * 100).toFixed(0) : "0"}%
                        </span>
                        <span className="text-gray-400 ml-1">环比</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Trend */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{trendLabel}</h3>
              <ResponsiveContainer width="100%" height={300}>
                {(data.trend || []).length > 14 ? (
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} angle={-30} textAnchor="end" height={60} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="营收" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="营收" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Orders Bar */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">订单数</h3>
              <ResponsiveContainer width="100%" height={300}>
                {(data.trend || []).length > 14 ? (
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} angle={-30} textAnchor="end" height={60} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#22c55e" name="订单数" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#22c55e" name="订单数" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">支付渠道占比</h3>
              {Object.keys(data.methodTotals || {}).length === 0 ? (
                <p className="text-gray-400 text-center py-16">暂无数据</p>
              ) : (
                <div className="flex">
                  <ResponsiveContainer width="55%" height={240}>
                    <PieChart>
                      <Pie data={Object.entries(data.methodTotals).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={85} dataKey="value">
                        {Object.keys(data.methodTotals).map((name, i) => (
                          <Cell key={name} fill={METHOD_COLORS[name] || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 pt-2">
                    {Object.entries(data.methodTotals).map(([name, value]) => (
                      <div key={name} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ background: METHOD_COLORS[name] || "#999" }} />
                        <span className="text-gray-600">{METHOD_LABELS[name] || name}</span>
                        <span className="font-medium">{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">订单类型占比</h3>
              {Object.keys(data.typeCount || {}).length === 0 ? (
                <p className="text-gray-400 text-center py-16">暂无数据</p>
              ) : (
                <div className="flex">
                  <ResponsiveContainer width="55%" height={240}>
                    <PieChart>
                      <Pie data={Object.entries(data.typeCount).map(([name, value]) => {
                        const map: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "自取", DELIVERY: "配送" };
                        return { name: map[name] || name, value };
                      })} cx="50%" cy="50%" outerRadius={85} dataKey="value">
                        {Object.keys(data.typeCount).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 pt-2">
                    {Object.entries(data.typeCount).map(([name, value], i) => {
                      const map: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "自取", DELIVERY: "配送" };
                      return (
                        <div key={name} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                          <span className="text-gray-600">{map[name] || name}</span>
                          <span className="font-medium">{value as number}单</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">热销菜品 Top 10（含利润分析）</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">菜品</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">销量</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">销售额</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">成本</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">利润</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">利润率</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data.topProducts || []).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", i < 3 ? "bg-amber-100 text-amber-700" : "text-gray-400")}>{i + 1}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 text-right">{p.quantity}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(p.cost || 0)}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(p.profit || 0)}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{p.profitRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data.topProducts || data.topProducts.length === 0) && (
              <div className="text-center py-8 text-gray-400">暂无销售数据</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
