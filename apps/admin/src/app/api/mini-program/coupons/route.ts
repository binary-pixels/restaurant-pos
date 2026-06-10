import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    select: { id: true, code: true, type: true, value: true, minSpend: true, startDate: true, endDate: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ coupons });
}
