import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const storeId = session.user.storeId;

  const [orders, customers, products] = await Promise.all([
    prisma.order.findMany({
      where: { storeId, orderNo: { contains: q } },
      select: { id: true, orderNo: true },
      take: 5,
    }),
    prisma.customer.findMany({
      where: { storeId, OR: [{ name: { contains: q } }, { phone: { contains: q } }] },
      select: { id: true, name: true, phone: true },
      take: 5,
    }),
    prisma.product.findMany({
      where: { storeId, name: { contains: q } },
      select: { id: true, name: true, price: true },
      take: 5,
    }),
  ]);

  const results = [
    ...orders.map((o) => ({ type: "order", id: o.id, label: "订单 " + o.orderNo, url: "/orders/" + o.id })),
    ...customers.map((c) => ({ type: "customer", id: c.id, label: "客户 " + (c.name || c.phone), url: "/marketing/members/" + c.id })),
    ...products.map((p) => ({ type: "product", id: p.id, label: "菜品 " + p.name + " ¥" + p.price, url: "/menu" })),
  ];

  return NextResponse.json({ results: results.slice(0, 10) });
}
