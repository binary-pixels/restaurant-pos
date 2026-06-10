import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NEXT_STATUS: Record<string, string> = {
  PENDING: "PREPARING",
  PREPARING: "SERVED",
};

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { itemId } = body;

  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStatus = NEXT_STATUS[item.status];
  if (!nextStatus) return NextResponse.json({ error: "Cannot advance from " + item.status }, { status: 400 });

  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: { status: nextStatus },
  });

  // If all items are SERVED, update order status
  const order = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: { items: true },
  });
  if (order) {
    const allServed = order.items.every((i) => i.status === "SERVED" || i.status === "CANCELLED");
    if (allServed && order.status !== "SERVED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "SERVED" },
      });
    } else if (nextStatus === "PREPARING" && order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PREPARING" },
      });
    }
  }

  return NextResponse.json({ ...updated, nextStatus: NEXT_STATUS[nextStatus] || null });
}
