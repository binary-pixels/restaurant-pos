import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  let storeId = req.nextUrl.searchParams.get("storeId") || "";
  if (!storeId) {
    const firstStore = await prisma.store.findFirst();
    if (!firstStore) return NextResponse.json({ orders: [] });
    storeId = firstStore.id;
  }
  const status = req.nextUrl.searchParams.get("status");
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  const where: any = { storeId };
  if (status === "active") {
    where.status = { in: ["PENDING", "CONFIRMED", "PREPARING", "SERVED", "DELIVERING"] };
  }
  // Filter by customer phone (token = phone)
  if (token) {
    const customer = await prisma.customer.findFirst({ where: { phone: token } });
    if (customer) where.customerId = customer.id;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { select: { id: true } },
      table: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      type: o.type,
      status: o.status,
      total: o.total,
      isPaid: o.isPaid,
      rating: o.rating,
      tableLabel: o.table?.label || null,
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}

// Save order rating
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { orderId, rating } = body;
  if (!orderId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  await prisma.order.update({ where: { id: orderId }, data: { rating } });
  return NextResponse.json({ success: true });
}
