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

// Customer cancel order
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("id");
  if (!orderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.customerId !== customer.id) return NextResponse.json({ error: "Not your order" }, { status: 403 });

  // Only allow cancel if not yet confirmed/preparing
  if (!["PENDING"].includes(order.status)) {
    return NextResponse.json({ error: "订单已在制作中，无法取消，请联系店员" }, { status: 400 });
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED", isClosed: true, closedAt: new Date() } });
  if (order.tableId) await prisma.table.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });

  return NextResponse.json({ success: true });
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
