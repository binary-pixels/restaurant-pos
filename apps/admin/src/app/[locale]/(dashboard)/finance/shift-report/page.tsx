"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@pos/shared";
import { Printer } from "lucide-react";

export default function ShiftReportPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/shift-report")
      .then((r) => r.json())
      .then(setData);
  }, []);

  function print() { window.print(); }

  if (!data) return <div className="text-center py-12 text-gray-400">加载中...</div>;

  const methodLabels: Record<string, string> = { CASH: "现金", WECHAT_QR: "微信", ALIPAY_QR: "支付宝", CARD: "银行卡", MEMBER_BALANCE: "余额" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <PageHeader title="交接班报表" description={data.date} />
        <button onClick={print} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"><Printer className="w-4 h-4 inline mr-1" />打印</button>
      </div>

      <div className="bg-white rounded-xl border p-6 max-w-2xl mx-auto print:border-0 print:shadow-none">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">交接班报表</h1>
          <p className="text-gray-500">{data.date}</p>
          <p className="text-gray-500">收银员: {data.cashier || "全部"}</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div><span className="text-gray-500">订单总数</span><p className="text-2xl font-bold">{data.totalOrders}</p></div>
          <div><span className="text-gray-500">营业总额</span><p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p></div>
          <div><span className="text-gray-500">退款笔数</span><p className="text-2xl font-bold text-red-600">{data.refundCount}</p></div>
          <div><span className="text-gray-500">退款金额</span><p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalRefund)}</p></div>
        </div>

        {/* Payment Methods */}
        <h3 className="font-semibold mb-3">支付方式明细</h3>
        <table className="w-full text-sm mb-6">
          <thead className="border-b"><tr><th className="text-left py-2">方式</th><th className="text-right py-2">笔数</th><th className="text-right py-2">金额</th></tr></thead>
          <tbody>
            {Object.entries(data.methodTotals || {}).map(([k, v]) => (
              <tr key={k} className="border-b">
                <td className="py-2">{methodLabels[k] || k}</td>
                <td className="py-2 text-right">{data.methodCounts?.[k] || 0}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(v as number)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="py-2">合计</td>
              <td className="py-2 text-right">{Object.values(data.methodCounts || {}).reduce((a: number, b: any) => a + b, 0)}</td>
              <td className="py-2 text-right">{formatCurrency(data.totalRevenue)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Cash Verification */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">现金核对</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">系统现金收入:</span><span className="text-right font-bold">{formatCurrency(data.methodTotals?.CASH || 0)}</span>
            <span className="text-gray-500">实际现金清点:</span><span className="text-right">___________</span>
            <span className="text-gray-500">差额:</span><span className="text-right">___________</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="border-t mt-8 pt-6 grid grid-cols-2 gap-8 text-sm">
          <div><p className="border-b pb-2 text-center text-gray-500">交班人签字</p></div>
          <div><p className="border-b pb-2 text-center text-gray-500">接班人签字</p></div>
        </div>
      </div>
    </div>
  );
}
