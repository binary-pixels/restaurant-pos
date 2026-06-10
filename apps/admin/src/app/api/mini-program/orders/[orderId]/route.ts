import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: true,
      payments: true,
      table: { select: { label: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}
