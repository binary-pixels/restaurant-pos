"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@pos/shared";
import { Plus, Copy, CheckCircle } from "lucide-react";

export default function GiftCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(100);
  const [count, setCount] = useState(10);

  useEffect(() => { fetch("/api/gift-codes").then((r) => r.json()).then((d) => setCodes(d.codes || [])).finally(() => setLoading(false)); }, []);

  async function generate() {
    const res = await fetch("/api/gift-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, count }) });
    const data = await res.json();
    if (data.codes) setCodes([...(data.codes as any[]), ...codes]);
  }

  function copyAll() {
    const text = codes.filter((c) => !c.isUsed).map((c) => c.code).join("\n");
    navigator.clipboard.writeText(text);
    alert("已复制 " + codes.filter((c) => !c.isUsed).length + " 个未使用码");
  }

  return (
    <div>
      <PageHeader title="礼品卡管理" />
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">面额</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-32 px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">数量</label>
            <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={100} className="w-24 px-3 py-2 border rounded-lg" />
          </div>
          <button onClick={generate} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus className="w-4 h-4 inline mr-1" />批量生成</button>
          <button onClick={copyAll} className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50"><Copy className="w-4 h-4 inline mr-1" />复制未使用</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4">兑换码</th><th className="text-right py-3 px-4">面额</th><th className="text-left py-3 px-4">状态</th><th className="text-left py-3 px-4">使用时间</th></tr></thead>
          <tbody className="divide-y">
            {codes.map((c) => (
              <tr key={c.id} className={c.isUsed ? "opacity-50" : ""}>
                <td className="py-3 px-4 font-mono text-sm">{c.code}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(c.amount)}</td>
                <td className="py-3 px-4">{c.isUsed ? <span className="text-xs text-gray-500">已使用</span> : <span className="text-xs text-green-600"><CheckCircle className="w-3 h-3 inline mr-1" />可用</span>}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{c.usedAt ? new Date(c.usedAt).toLocaleString("zh-CN") : "--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
