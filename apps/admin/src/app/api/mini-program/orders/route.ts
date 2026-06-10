import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Note: In production, authenticate via token to get customerId
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId") || "";
  const status = req.nextUrl.searchParams.get("status");

  const where: any = { storeId };
  if (status === "active") {
    where.status = { in: ["PENDING", "CONFIRMED", "PREPARING", "SERVED"] };
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
      tableLabel: o.table?.label || null,
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
