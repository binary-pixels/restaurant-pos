"use client";

import { useState } from "react";
import { formatCurrency } from "@pos/shared";
import { cn } from "@/lib/utils";
import { Search, Receipt, Clock } from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "现金", WECHAT_QR: "微信", ALIPAY_QR: "支付宝",
  CARD: "银行卡", MEMBER_BALANCE: "余额",
};

type Props = {
  payments: any[];
  auditLogs: any[];
};

export function TransactionsList({ payments, auditLogs }: Props) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"payments" | "audit">("payments");

  const filtered = payments.filter((p) => {
    if (!search) return true;
    return p.order?.orderNo?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("payments")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium", tab === "payments" ? "bg-blue-600 text-white" : "bg-white border")}
        >
          <Receipt className="w-4 h-4 inline mr-1" /> 收款记录
        </button>
        <button
          onClick={() => setTab("audit")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium", tab === "audit" ? "bg-blue-600 text-white" : "bg-white border")}
        >
          <Clock className="w-4 h-4 inline mr-1" /> 操作日志
        </button>
      </div>

      {tab === "payments" ? (
        <>
          <div className="mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索订单号..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">支付方式</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">金额</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{p.order?.orderNo || "--"}</td>
                    <td className="py-3 px-4">{PAYMENT_LABELS[p.method] || p.method}</td>
                    <td className={cn("py-3 px-4 text-right font-medium", p.status === "SUCCESS" ? "text-green-600" : "text-red-600")}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("text-xs px-2 py-0.5 rounded", p.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {p.status === "SUCCESS" ? "成功" : p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(p.createdAt).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-400">暂无收款记录</div>}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">对象</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{log.entity} #{log.entityId?.slice(-8)}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditLogs.length === 0 && <div className="text-center py-12 text-gray-400">暂无操作日志</div>}
        </div>
      )}
    </div>
  );
}
