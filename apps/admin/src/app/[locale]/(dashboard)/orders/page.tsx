"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, ORDER_STATUS_MAP } from "@pos/shared";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (row: any) => {
    router.push(`/${locale}/orders/${row.id}`);
  };

  return (
    <div>
      <PageHeader title={t("title")} />

      <div className="bg-white rounded-xl border border-gray-200">
        <DataTable
          columns={[
            { key: "orderNo", header: t("orderNo"),
              render: (row: any) => <span className="text-blue-600 font-medium cursor-pointer">{row.orderNo}</span>
            },
            { key: "type", header: t("type"),
              render: (row: any) => {
                const map: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "自取", DELIVERY: "配送" };
                return map[row.type] || row.type;
              },
            },
            { key: "tableLabel", header: t("table"), render: (row: any) => row.tableLabel || "--" },
            { key: "cashierName", header: t("cashier"), render: (row: any) => row.cashierName || "--" },
            { key: "status", header: t("status"),
              render: (row: any) => (
                <StatusBadge status={row.status} statusMap={
                  Object.fromEntries(Object.entries(ORDER_STATUS_MAP).map(([k, v]) => [k, { label: v.label, color: v.color }]))
                } />
              ),
            },
            { key: "total", header: t("total"), render: (row: any) => formatCurrency(row.total) },
            { key: "isPaid", header: "支付",
              render: (row: any) => (
                <span className={row.isPaid ? "text-green-600" : "text-red-600"}>
                  {row.isPaid ? "已支付" : "未支付"}
                </span>
              ),
            },
            { key: "createdAt", header: t("createdAt"), render: (row: any) => new Date(row.createdAt).toLocaleString("zh-CN") },
          ]}
          data={orders}
          isLoading={loading}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
