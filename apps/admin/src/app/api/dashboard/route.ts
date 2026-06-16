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

  const [todayOrders, todayRevenue, activeTables, todayCustomers, recentOrders] = await Promise.all([
    prisma.order.count({
      where: { storeId, createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", paidAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
    }),
    prisma.table.count({ where: { zone: { storeId }, status: "OCCUPIED" } }),
    prisma.order.groupBy({ by: ["customerId"], where: { storeId, customerId: { not: null }, createdAt: { gte: today, lt: tomorrow } } }),
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

  // Additional stats
  const [pendingOrders, todayReservations, lowStockCount, activePromos, todayBirthdays] = await Promise.all([
    prisma.order.count({ where: { storeId, status: "PENDING", createdAt: { gte: today, lt: tomorrow } } }),
    prisma.reservation.count({ where: { storeId, date: today.toISOString().slice(0, 10), status: { not: "CANCELLED" } } }),
    prisma.product.count({ where: { storeId, isActive: true, stock: { lte: 10 } } }),
    prisma.coupon.count({ where: { storeId, isActive: true } }),
    prisma.customer.count({ where: { storeId, birthday: { contains: "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0") } } }),
  ]);

  return NextResponse.json({
    todayOrders,
    todayRevenue: todayRevenue._sum.amount || 0,
    todayCustomers: todayCustomers.length,
    activeTables,
    pendingOrders,
    todayReservations,
    lowStockCount,
    activePromos,
    todayBirthdays,
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
