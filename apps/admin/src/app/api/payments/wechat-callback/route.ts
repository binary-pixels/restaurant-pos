import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { wechatPayGateway } from "@/lib/payment/wechat";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await wechatPayGateway.verifyCallback(body);
  if (!result) {
    return NextResponse.json({ code: "FAIL", message: "Invalid signature" }, { status: 400 });
  }

  // Find the order by orderNo (out_trade_no)
  const order = await prisma.order.findUnique({
    where: { orderNo: result.orderId },
    include: { payments: true },
  });

  if (!order) {
    return NextResponse.json({ code: "FAIL", message: "Order not found" }, { status: 404 });
  }

  // Update payment to SUCCESS
  const pendingPayment = order.payments.find((p) => p.status === "PENDING");
  if (pendingPayment) {
    await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        status: "SUCCESS",
        gatewayRef: result.transactionId,
        paidAt: new Date(),
      },
    });
  }

  // Update order
  const totalPaid = order.payments.reduce(
    (sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0),
    0
  ) + result.amount;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paidAmount: totalPaid,
      isPaid: totalPaid >= order.total,
      status: totalPaid >= order.total ? "CONFIRMED" : order.status,
    },
  });

  return NextResponse.json({ code: "SUCCESS" });
}
