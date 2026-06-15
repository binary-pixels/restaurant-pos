import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { storeId: session.user.storeId, rating: { not: null } },
    include: {
      items: { select: { productName: true } },
      customer: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const rated = orders.filter((o) => o.rating != null);
  const avgRating = rated.length > 0 ? (rated.reduce((s, o) => s + (o.rating || 0), 0) / rated.length).toFixed(1) : "0";

  const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
  rated.forEach((o) => { if (o.rating && o.rating >= 1 && o.rating <= 5) distribution[o.rating - 1]++; });

  return NextResponse.json({
    avgRating,
    totalRated: rated.length,
    distribution,
    orders: rated.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      rating: o.rating,
      customerName: o.customer?.name || "匿名",
      items: o.items.map((i) => i.productName).join(", "),
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
