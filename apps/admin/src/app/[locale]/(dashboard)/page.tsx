"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { DollarSign, ShoppingCart, Users, Table, Loader2 } from "lucide-react";

type DashData = {
  todayOrders: number;
  todayRevenue: number;
  todayCustomers: number;
  activeTables: number;
  pendingOrders: number;
  todayReservations: number;
  lowStockCount: number;
  activePromos: number;
  todayBirthdays: number;
  recentOrders: {
    id: string;
    orderNo: string;
    type: string;
    total: number;
    isPaid: boolean;
    tableLabel: string | null;
    cashierName: string | null;
    createdAt: string;
  }[];
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: t("todayRevenue"),
      value: `¥${data.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      label: t("todayOrders"),
      value: String(data.todayOrders),
      icon: ShoppingCart,
      color: "bg-green-500",
    },
    {
      label: t("todayCustomers"),
      value: String(data.todayCustomers || 0),
      icon: Users,
      color: "bg-purple-500",
    },
    {
      label: t("activeTables"),
      value: String(data.activeTables),
      icon: Table,
      color: "bg-orange-500",
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Operations Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "待处理订单", value: data.pendingOrders || 0, color: "text-red-600", link: "/orders" },
          { label: "今日预订", value: data.todayReservations || 0, color: "text-blue-600", link: "/tables/reservations" },
          { label: "库存预警", value: data.lowStockCount || 0, color: "text-amber-600", link: "/menu/inventory" },
          { label: "进行中活动", value: data.activePromos || 0, color: "text-green-600", link: "/marketing/coupons" },
          { label: "今日生日", value: data.todayBirthdays || 0, color: "text-pink-600", link: "/marketing/birthdays" },
        ].map((s) => (
          <a key={s.label} href={s.link} className="bg-white rounded-xl border p-3 hover:shadow-sm transition-shadow">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={"text-xl font-bold " + s.color}>{s.value}</p>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">最近订单</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">暂无订单</div>
          ) : (
            data.recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNo}</p>
                  <p className="text-sm text-gray-500">
                    {order.tableLabel || "外卖"} · {order.cashierName || "--"} ·{" "}
                    {order.type === "DINE_IN" ? "堂食" : order.type === "TAKEOUT" ? "自取" : "配送"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">¥{order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{order.isPaid ? "已支付" : "未支付"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
