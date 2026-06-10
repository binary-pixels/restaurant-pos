import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { wechatPayGateway } from "@/lib/payment/wechat";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId, method, openId } = body;

  if (!orderId || !method) {
    return NextResponse.json({ error: "orderId and method required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.isPaid) return NextResponse.json({ error: "Order already paid" }, { status: 400 });

  let paymentResult;
  if (method === "WECHAT_QR" || method === "WECHAT_JSAPI") {
    paymentResult = await wechatPayGateway.createPayment({
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.total,
      description: "餐厅点餐",
      openId,
    });
  } else if (method === "CASH") {
    // Cash payment - mark paid directly
    await prisma.payment.create({
      data: { orderId, method, amount: order.total, status: "SUCCESS", paidAt: new Date() },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true, paidAmount: order.total, status: "CONFIRMED" },
    });
    return NextResponse.json({ success: true, method: "CASH" });
  } else {
    return NextResponse.json({ error: "Unsupported method" }, { status: 400 });
  }

  if (!paymentResult.success) {
    return NextResponse.json({ error: paymentResult.error }, { status: 500 });
  }

  // Record payment as pending
  await prisma.payment.create({
    data: {
      orderId,
      method,
      amount: order.total,
      status: "PENDING",
      gatewayRef: paymentResult.gatewayRef || null,
    },
  });

  // Return prepay data for wx.requestPayment()
  return NextResponse.json({
    success: true,
    prepayData: paymentResult.prepayData,
  });
}
