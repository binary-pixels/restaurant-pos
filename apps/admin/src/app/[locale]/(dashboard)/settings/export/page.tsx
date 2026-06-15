"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Download, FileSpreadsheet, Users, Package, Receipt, Database } from "lucide-react";

const ITEMS = [
  { key: "orders", label: "订单数据", desc: "导出所有订单（订单号/类型/状态/桌台/客户/金额/支付状态/时间）", icon: FileSpreadsheet, color: "bg-blue-500" },
  { key: "customers", label: "客户数据", desc: "导出所有客户（姓名/电话/等级/积分/余额/消费总额/次数）", icon: Users, color: "bg-green-500" },
  { key: "products", label: "商品数据", desc: "导出所有菜品（名称/分类/价格/成本/库存/状态）", icon: Package, color: "bg-purple-500" },
  { key: "payments", label: "收款记录", desc: "导出最近500条收款（订单号/支付方式/金额/状态/时间）", icon: Receipt, color: "bg-amber-500" },
];

export default function ExportPage() {
  function download(key: string) {
    window.open("/api/export?table=" + key, "_blank");
  }

  return (
    <div>
      <PageHeader title="数据导出" description="导出 CSV 格式数据，可用 Excel 打开" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ITEMS.map((item) => (
          <div key={item.key} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => download(item.key)}>
            <div className="flex items-start gap-3">
              <div className={item.color + " p-2.5 rounded-lg"}><item.icon className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">{item.label} <Download className="w-4 h-4 text-gray-400" /></h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Database className="w-5 h-5" /> 数据库备份</h3>
        <p className="text-sm text-gray-500 mb-4">SQLite 数据库文件直接复制即可备份</p>
        <code className="text-xs bg-gray-100 px-3 py-2 rounded block">cp packages/db/prisma/dev.db ~/backup/pos-backup-{new Date().toISOString().slice(0,10)}.db</code>
      </div>
    </div>
  );
}
