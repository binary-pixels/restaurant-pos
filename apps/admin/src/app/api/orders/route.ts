import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { storeId },
    include: {
      table: { select: { label: true } },
      cashier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      type: o.type,
      status: o.status,
      total: o.total,
      isPaid: o.isPaid,
      tableLabel: o.table?.label || null,
      cashierName: o.cashier?.name || "小程序顾客",
      createdAt: o.createdAt,
    }))
  );
}
