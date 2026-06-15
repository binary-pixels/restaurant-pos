"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Gift, Cake } from "lucide-react";

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function BirthdaysPage() {
  const [data, setData] = useState<any>({ thisMonth: [], all: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/birthdays")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function sendCoupon(customerId: string) {
    await fetch("/api/birthdays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
    alert("已发送生日优惠券 ¥20");
  }

  const currentMonth = new Date().getMonth();

  return (
    <div>
      <PageHeader title="生日管理" description={MONTHS[currentMonth] + "生日客户: " + data.thisMonth.length + " 人"} />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold flex items-center gap-2"><Cake className="w-5 h-5 text-pink-500" />本月生日 ({{}}.length)</h3>
          <p className="text-3xl font-bold text-pink-500 mt-2">{data.thisMonth.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-pink-50 border-b font-semibold text-sm">本月生日</div>
          <div className="divide-y">
            {data.thisMonth.map((c: any) => (
              <div key={c.id} className="p-3 flex items-center justify-between">
                <div><span className="font-medium">{c.name}</span> <span className="text-xs text-gray-400">{c.phone}</span> <span className="text-xs text-pink-500 ml-2">{c.birthday?.slice(5)}</span></div>
                <button onClick={() => sendCoupon(c.id)} className="px-2 py-1 text-xs bg-pink-50 text-pink-600 rounded hover:bg-pink-100"><Gift className="w-3 h-3 inline mr-1" />发券</button>
              </div>
            ))}
            {data.thisMonth.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">本月无生日客户</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b font-semibold text-sm">全部已登记生日</div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {data.all.map((c: any) => (
              <div key={c.id} className="p-3 flex items-center justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-gray-500">{c.birthday}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
