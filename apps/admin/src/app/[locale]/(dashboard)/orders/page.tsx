"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, ORDER_STATUS_MAP } from "@pos/shared";
import { Search } from "lucide-react";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, [search]);

  function loadOrders() {
    setLoading(true);
    const url = search ? "/api/orders?search=" + encodeURIComponent(search) : "/api/orders";
    fetch(url)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <PageHeader title={t("title")} />
      <div className="mb-4 relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户姓名/手机号/订单号"
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <DataTable
          columns={[
            { key: "orderNo", header: t("orderNo"), render: (row: any) => <span className="text-blue-600 font-medium">{row.orderNo}</span> },
            { key: "type", header: t("type"), render: (row: any) => {
              const map: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "自取", DELIVERY: "配送" };
              return map[row.type] || row.type;
            }},
            { key: "tableLabel", header: t("table"), render: (row: any) => row.tableLabel || "--" },
            { key: "customer", header: "客户", render: (row: any) => row.customerName || row.customerPhone || "散客" },
            { key: "status", header: t("status"), render: (row: any) => (
              <StatusBadge status={row.status} statusMap={
                Object.fromEntries(Object.entries(ORDER_STATUS_MAP).map(([k, v]) => [k, { label: v.label, color: v.color }]))
              } />
            )},
            { key: "total", header: t("total"), render: (row: any) => formatCurrency(row.total) },
            { key: "isPaid", header: "支付", render: (row: any) => (
              <span className={row.isPaid ? "text-green-600" : "text-red-600"}>{row.isPaid ? "已支付" : "未支付"}</span>
            )},
            { key: "createdAt", header: t("createdAt"), render: (row: any) => new Date(row.createdAt).toLocaleString("zh-CN") },
          ]}
          data={orders}
          isLoading={loading}
          onRowClick={(row) => router.push("/" + locale + "/orders/" + row.id)}
        />
      </div>
    </div>
  );
}
