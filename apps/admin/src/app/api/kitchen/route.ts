import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: {
      storeId,
      status: { in: ["PENDING", "CONFIRMED", "PREPARING", "SERVED"] },
      isClosed: false,
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
      table: { select: { label: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      status: o.status,
      type: o.type,
      tableLabel: o.table?.label || null,
      note: o.note,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: i.quantity,
        status: i.status,
      })),
    })),
  });
}
