import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ items: [] });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ items: [] });

  // Get customer's order items, grouped by product
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const productCounts: Record<string, { name: string; count: number }> = {};
  for (const order of orders) {
    for (const item of order.items) {
      if (!productCounts[item.productId]) productCounts[item.productId] = { name: item.productName, count: 0 };
      productCounts[item.productId].count += item.quantity;
    }
  }

  const frequent = Object.entries(productCounts)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Last order
  const lastOrder = orders[0];
  const lastItems = lastOrder ? lastOrder.items.map((i) => ({ name: i.productName, qty: i.quantity })) : [];

  return NextResponse.json({ frequent, lastItems, lastOrderId: lastOrder?.id });
}
