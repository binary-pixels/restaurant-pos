import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayOrders, todayRevenue, activeTables, recentOrders] = await Promise.all([
    prisma.order.count({
      where: { storeId, createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", paidAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
    }),
    prisma.table.count({ where: { zone: { storeId }, status: "OCCUPIED" } }),
    prisma.order.findMany({
      where: { storeId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        table: { select: { label: true } },
        cashier: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    todayOrders,
    todayRevenue: todayRevenue._sum.amount || 0,
    activeTables,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      type: o.type,
      total: o.total,
      isPaid: o.isPaid,
      tableLabel: o.table?.label || null,
      cashierName: o.cashier?.name || "小程序顾客",
      createdAt: o.createdAt,
    })),
  });
}
