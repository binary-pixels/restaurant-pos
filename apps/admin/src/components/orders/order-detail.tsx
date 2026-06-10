"use client";

import { useRouter } from "next/navigation";
import { cancelOrder, refundOrder, payOrder, closeOrder, updateOrderStatus } from "@/actions/order-actions";
import { formatCurrency } from "@pos/shared";
import { cn } from "@/lib/utils";
import { ArrowLeft, Ban, RotateCcw, Printer, CheckCircle, Wallet, Truck } from "lucide-react";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待确认", CONFIRMED: "已确认", PREPARING: "制作中",
  SERVED: "已上菜", COMPLETED: "已完成", CANCELLED: "已取消", REFUNDED: "已退款",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "现金", WECHAT_QR: "微信支付", ALIPAY_QR: "支付宝",
  CARD: "银行卡", MEMBER_BALANCE: "会员余额",
};

type Props = { order: any };

export function OrderDetail({ order }: Props) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  async function handleCancel() {
    if (!confirm("确认取消此订单？")) return;
    setProcessing(true);
    await cancelOrder(order.id);
    router.refresh();
  }

  async function handleRefund() {
    if (!confirm("确认退款？所有已付款项将退回。")) return;
    setProcessing(true);
    await refundOrder(order.id);
    router.refresh();
  }

  const canCancel = !["CANCELLED", "REFUNDED", "COMPLETED"].includes(order.status);
  const canRefund = order.isPaid && !["CANCELLED", "REFUNDED"].includes(order.status);
  const canMarkPaid = !order.isPaid && !["CANCELLED", "REFUNDED"].includes(order.status);

  async function handleMarkPaid() {
    if (!confirm("确认已收到 ¥" + order.total.toFixed(2) + " 现金？")) return;
    setProcessing(true);
    await payOrder({ orderId: order.id, method: "CASH", amount: order.total });
    await closeOrder(order.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <button
          onClick={() => window.open("/api/print?orderId=" + order.id + "&format=html", "_blank")}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1"
        >
          <Printer className="w-4 h-4" /> 重打单据
        </button>
        {canCancel && (
          <button onClick={handleCancel} disabled={processing} className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
            <Ban className="w-4 h-4" /> 取消订单
          </button>
        )}
        {canMarkPaid && (
          <button onClick={handleMarkPaid} disabled={processing} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1">
            <Wallet className="w-4 h-4" /> 现金收款
          </button>
        )}
        {canRefund && (
          <button onClick={handleRefund} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> 退款
          </button>
        )}
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="订单状态" value={STATUS_LABELS[order.status] || order.status} />
        <InfoCard label="订单类型" value={order.type === "DINE_IN" ? "堂食" : order.type === "TAKEOUT" ? "自取" : "配送"} />
        <InfoCard label="桌台" value={order.table?.label || "--"} />
        <InfoCard label="收银员" value={order.cashier?.name || "小程序顾客"} />
        <InfoCard label="下单时间" value={new Date(order.createdAt).toLocaleString("zh-CN")} />
        <InfoCard label="就餐人数" value={`${order.guestCount}人`} />
        <InfoCard label="客户" value={order.customer?.name || "散客"} />
        {order.note && <InfoCard label="备注" value={order.note} />}
        {order.type === "DELIVERY" && order.note && order.note.includes("地址:") && (
          <InfoCard label="配送信息" value={order.note.replace(/\|/g, "\n")} />
        )}
      </div>

      {/* Delivery status actions */}
      {order.type === "DELIVERY" && order.isPaid && order.status === "CONFIRMED" && (
        <button
          onClick={async () => { await updateOrderStatus(order.id, "DELIVERING"); router.refresh(); }}
          className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1"
        >
          <Truck className="w-4 h-4" /> 开始配送
        </button>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b font-semibold">菜品明细</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">菜品</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">数量</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">单价</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">小计</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-3 px-4">{item.productName}</td>
                <td className="py-3 px-4 text-center">×{item.quantity}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b font-semibold">付款记录</div>
        {order.payments.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">暂无付款</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500">方式</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">金额</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-3 px-4">{PAYMENT_LABELS[p.method] || p.method}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={cn("text-xs px-2 py-0.5 rounded", p.status === "SUCCESS" ? "bg-green-100 text-green-700" : p.status === "REFUNDED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600")}>
                      {p.status === "SUCCESS" ? "成功" : p.status === "REFUNDED" ? "已退款" : p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleString("zh-CN") : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border p-6">
        <div className="space-y-2 ml-auto max-w-xs">
          <Row label="小计" value={formatCurrency(order.subtotal)} />
          {order.discounts.map((d: any) => (
            <Row key={d.id} label={d.name} value={`-${formatCurrency(d.amount)}`} className="text-red-600" />
          ))}
          <Row label="合计" value={formatCurrency(order.total)} className="text-lg font-bold" />
          <Row label="已付" value={formatCurrency(order.paidAmount)} className="text-green-600" />
          {order.changeAmount > 0 && <Row label="找零" value={formatCurrency(order.changeAmount)} />}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className="text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
