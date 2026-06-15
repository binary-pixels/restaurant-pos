"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Star, TrendingUp } from "lucide-react";

export default function RatingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ratings")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="评价管理" description={"平均 " + data.avgRating + " 分 · " + data.totalRated + " 条评价"} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="text-5xl font-bold text-amber-500 mb-2">{data.avgRating}</div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={"w-6 h-6 " + (s <= Math.round(Number(data.avgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">综合评分</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">评分分布</h3>
          {data.distribution.map((count: number, i: number) => (
            <div key={i} className="flex items-center gap-2 mb-1 text-sm">
              <span className="w-8">{5 - i}★</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: data.totalRated > 0 ? (count / data.totalRated * 100) + "%" : "0%" }} />
              </div>
              <span className="w-8 text-right text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4">订单号</th>
              <th className="text-left py-3 px-4">客户</th>
              <th className="text-left py-3 px-4">菜品</th>
              <th className="text-center py-3 px-4">评分</th>
              <th className="text-left py-3 px-4">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.orders.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{o.orderNo}</td>
                <td className="py-3 px-4 text-gray-500">{o.customerName}</td>
                <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{o.items}</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={"w-3.5 h-3.5 " + (s <= o.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                    ))}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.orders.length === 0 && <div className="text-center py-12 text-gray-400">暂无评价</div>}
      </div>
    </div>
  );
}
