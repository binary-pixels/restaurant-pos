import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildHtmlTicket } from "@/lib/printer/ticket-builder";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("orderId");
  const format = req.nextUrl.searchParams.get("format") || "html";

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: { where: { status: "SUCCESS" }, take: 1 },
      table: { select: { label: true } },
      cashier: { select: { name: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const store = await prisma.store.findUnique({ where: { id: session.user.storeId } });

  const typeLabels: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "自取", DELIVERY: "配送" };
  const methodLabels: Record<string, string> = { CASH: "现金", WECHAT_QR: "微信", ALIPAY_QR: "支付宝" };

  const ticketData = {
    storeName: store?.name || "餐厅",
    storeAddress: store?.address || "",
    storePhone: store?.phone || "",
    orderNo: order.orderNo,
    tableLabel: order.table?.label || undefined,
    type: typeLabels[order.type] || order.type,
    cashierName: order.cashier?.name || "小程序顾客",
    items: order.items.map((i) => ({
      name: i.productName,
      qty: i.quantity,
      price: i.unitPrice,
    })),
    subtotal: order.subtotal,
    discount: order.discountTotal,
    total: order.total,
    paidAmount: order.paidAmount,
    changeAmount: order.changeAmount,
    paymentMethod: methodLabels[order.payments[0]?.method] || "未支付",
    createdAt: order.createdAt.toISOString(),
    note: order.note || undefined,
  };

  if (format === "html") {
    const html = buildHtmlTicket(ticketData);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(ticketData);
}
