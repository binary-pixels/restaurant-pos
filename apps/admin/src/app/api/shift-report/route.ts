import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS", paidAt: { gte: today, lt: tomorrow }, order: { storeId: session.user.storeId } },
  });

  const refunds = await prisma.payment.findMany({
    where: { status: "REFUNDED", paidAt: { gte: today, lt: tomorrow }, order: { storeId: session.user.storeId } },
  });

  const orders = await prisma.order.count({
    where: { storeId: session.user.storeId, createdAt: { gte: today, lt: tomorrow } },
  });

  const methodTotals: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};
  for (const p of payments) {
    methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
    methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
  }

  const totalRevenue = Object.values(methodTotals).reduce((a, b) => a + b, 0);
  const totalRefund = refunds.reduce((s, r) => s + r.amount, 0);

  return NextResponse.json({
    date: today.toLocaleDateString("zh-CN"),
    totalOrders: orders,
    totalRevenue,
    refundCount: refunds.length,
    totalRefund,
    methodTotals,
    methodCounts,
    cashier: session.user.name || "",
  });
}
