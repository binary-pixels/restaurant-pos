import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "day";  // day | week | month | year | custom
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const now = new Date();
  let start: Date;

  switch (mode) {
    case "week":
      start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
      break;
    case "month": {
      // Current month start
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      start = from ? new Date(from) : new Date(now.setHours(0, 0, 0, 0));
      break;
    default: // day
      start = new Date(now); start.setHours(0, 0, 0, 0);
  }

  // Revenue & orders
  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS", paidAt: { gte: start } },
    include: { order: { select: { storeId: true, type: true } } },
  });
  const storePayments = payments.filter((p) => p.order.storeId === storeId);

  const methodTotals: Record<string, number> = {};
  for (const p of storePayments) methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
  const totalRevenue = Object.values(methodTotals).reduce((a, b) => a + b, 0);

  const orders = await prisma.order.findMany({
    where: { storeId, createdAt: { gte: start } },
    select: { type: true, total: true, createdAt: true },
  });

  const typeCount: Record<string, number> = {};
  for (const o of orders) typeCount[o.type] = (typeCount[o.type] || 0) + 1;

  // Top products
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { storeId, createdAt: { gte: start } } },
    include: { product: { select: { name: true } } },
  });
  const productSales: Record<string, { name: string; quantity: number; revenue: number; cost: number }> = {};
  for (const item of orderItems) {
    if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0, cost: 0 };
    productSales[item.productId].quantity += item.quantity;
    productSales[item.productId].revenue += item.subtotal;
  }
  // Look up product costs
  for (const pid of Object.keys(productSales)) {
    const product = await prisma.product.findUnique({ where: { id: pid }, select: { costPrice: true } });
    if (product?.costPrice) {
      productSales[pid].cost = product.costPrice * productSales[pid].quantity;
    }
  }
  const topProducts = Object.values(productSales).map((p) => ({
    ...p,
    profit: p.revenue - p.cost,
    profitRate: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100).toFixed(1) : "0",
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const totalProfit = Object.values(productSales).reduce((s, p) => s + (p.revenue - p.cost), 0);
  const totalCost = Object.values(productSales).reduce((s, p) => s + p.cost, 0);

  // Trend data depends on mode
  const trend: { date: string; revenue: number; orders: number }[] = [];

  if (mode === "day") {
    // Hourly breakdown (24h)
    for (let h = 0; h < 24; h++) {
      const hStart = new Date(start); hStart.setHours(h, 0, 0, 0);
      const hEnd = new Date(start); hEnd.setHours(h, 59, 59, 999);
      const hPayments = storePayments.filter((p) => {
        if (!p.paidAt) return false;
        return p.paidAt >= hStart && p.paidAt <= hEnd;
      });
      const hOrders = orders.filter((o) => o.createdAt >= hStart && o.createdAt <= hEnd);
      trend.push({
        date: `${String(h).padStart(2, "0")}:00`,
        revenue: hPayments.reduce((s, p) => s + p.amount, 0),
        orders: hOrders.length,
      });
    }
  } else if (mode === "week") {
    // Daily breakdown (7 days)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = new Date(d); ds.setHours(0, 0, 0, 0);
      const de = new Date(d); de.setHours(23, 59, 59, 999);
      const dPayments = storePayments.filter((p) => p.paidAt && p.paidAt >= ds && p.paidAt <= de);
      const dOrders = orders.filter((o) => o.createdAt >= ds && o.createdAt <= de);
      trend.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: dPayments.reduce((s, p) => s + p.amount, 0),
        orders: dOrders.length,
      });
    }
  } else if (mode === "month") {
    // Daily breakdown (current month)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = new Date(now.getFullYear(), now.getMonth(), d);
      const de = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59, 999);
      const dPayments = storePayments.filter((p) => p.paidAt && p.paidAt >= ds && p.paidAt <= de);
      const dOrders = orders.filter((o) => o.createdAt >= ds && o.createdAt <= de);
      trend.push({
        date: `${now.getMonth() + 1}/${d}`,
        revenue: dPayments.reduce((s, p) => s + p.amount, 0),
        orders: dOrders.length,
      });
    }
  } else {
    // year or custom: monthly breakdown
    const months = mode === "year" ? 12 : 6;
    const baseYear = now.getFullYear();
    for (let m = months - 1; m >= 0; m--) {
      const month = now.getMonth() - m;
      const y = baseYear + (month < 0 ? -1 : 0);
      const adjMonth = month < 0 ? month + 12 : month;
      const ms = new Date(y, adjMonth, 1);
      const me = new Date(y, adjMonth + 1, 0, 23, 59, 59, 999);
      const mPayments = storePayments.filter((p) => p.paidAt && p.paidAt >= ms && p.paidAt <= me);
      const mOrders = orders.filter((o) => o.createdAt >= ms && o.createdAt <= me);
      trend.push({
        date: `${ms.getFullYear()}/${String(ms.getMonth() + 1).padStart(2, "0")}`,
        revenue: mPayments.reduce((s, p) => s + p.amount, 0),
        orders: mOrders.length,
      });
    }
  }

  return NextResponse.json({
    totalRevenue, totalOrders: orders.length,
    methodTotals, typeCount, topProducts,
    trend, mode,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    totalProfit,
    totalCost,
    // Previous period comparison
    prevRevenue: 0,
    prevOrders: 0,
  });

  // Fetch previous period for comparison
  const periodLength = new Date().getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - periodLength);
  const prevEnd = new Date(start.getTime() - 1);

  const prevPayments = await prisma.payment.aggregate({
    where: { status: "SUCCESS", paidAt: { gte: prevStart, lt: prevEnd }, order: { storeId } },
    _sum: { amount: true },
  });
  const prevOrders = await prisma.order.count({
    where: { storeId, createdAt: { gte: prevStart, lt: prevEnd } },
  });

  return NextResponse.json({
    totalRevenue, totalOrders: orders.length,
    methodTotals, typeCount, topProducts,
    trend, mode,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    totalProfit, totalCost,
    prevRevenue: prevPayments._sum.amount || 0,
    prevOrders: prevOrders,
  });
}
