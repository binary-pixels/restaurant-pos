"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Search } from "lucide-react";

const ACTIONS = ["", "order.create", "order.cancel", "order.refund", "order.close", "payment.create"];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    params.set("page", String(page));
    fetch("/api/audit-logs?" + params.toString())
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [action, page]);

  const actionLabels: Record<string, string> = {
    "": "全部操作",
    "order.create": "创建订单",
    "order.cancel": "取消订单",
    "order.refund": "退款",
    "order.close": "结单",
    "payment.create": "收款",
  };

  return (
    <div>
      <PageHeader title="操作日志" description="系统操作审计追踪" />
      <div className="flex items-center gap-4 mb-4">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
          {ACTIONS.map((a) => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-30">上一页</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-30">下一页</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">时间</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">对象</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(l.createdAt).toLocaleString("zh-CN")}</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{l.action}</span>
                </td>
                <td className="py-3 px-4 text-gray-500">{l.entity} #{l.entityId?.slice(-8)}</td>
                <td className="py-3 px-4 text-gray-400 text-xs">{l.details || "--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && <div className="text-center py-12 text-gray-400">暂无操作日志</div>}
      </div>
    </div>
  );
}
