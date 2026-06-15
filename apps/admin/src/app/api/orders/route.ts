import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const where: any = { storeId };

  // Search by customer name or phone
  if (search) {
    const customers = await prisma.customer.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ],
      },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);
    if (customerIds.length > 0) {
      where.customerId = { in: customerIds };
    } else {
      where.orderNo = { contains: search }; // fallback: search order number
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      table: { select: { label: true } },
      cashier: { select: { name: true } },
      customer: { select: { name: true, phone: true } },
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
      customerName: o.customer?.name || null,
      customerPhone: o.customer?.phone || null,
      createdAt: o.createdAt,
    }))
  );
}
