import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Issue coupon to a customer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { couponId, customerId } = body;
  if (!couponId || !customerId) return NextResponse.json({ error: "couponId and customerId required" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

  // Create a new coupon for this customer (clone)
  const issued = await prisma.coupon.create({
    data: {
      storeId: coupon.storeId,
      customerId,
      code: coupon.code + "-" + Date.now().toString(36),
      type: coupon.type,
      value: coupon.value,
      minSpend: coupon.minSpend,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      usageLimit: 1,
    },
  });

  return NextResponse.json(issued);
}

// Validate and use a coupon
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { code, orderTotal, orderId } = body;

  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return NextResponse.json({ valid: false, error: "优惠券不存在" });
  if (!coupon.isActive) return NextResponse.json({ valid: false, error: "优惠券已失效" });

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate)
    return NextResponse.json({ valid: false, error: "优惠券不在有效期内" });

  if (coupon.usedCount >= coupon.usageLimit)
    return NextResponse.json({ valid: false, error: "优惠券已用完" });

  if (orderTotal !== undefined && orderTotal < coupon.minSpend)
    return NextResponse.json({ valid: false, error: "订单金额不足，需满¥" + coupon.minSpend });

  // Calculate discount
  let discount = 0;
  if (coupon.type === "FIXED_DISCOUNT") discount = coupon.value;
  else if (coupon.type === "PERCENTAGE") discount = (orderTotal || 0) * (coupon.value / 100);
  else if (coupon.type === "FREE_DELIVERY") discount = 0; // handled separately

  // Mark as used
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  });

  // Record usage
  await prisma.couponUsage.create({
    data: { couponId: coupon.id, orderId: orderId || null, orderNo: null, amount: discount },
  });

  return NextResponse.json({ valid: true, discount, type: coupon.type, value: coupon.value, couponId: coupon.id });
}

// List coupons for a customer or all
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  const where: any = { isActive: true };
  if (customerId) where.customerId = customerId;

  const coupons = await prisma.coupon.findMany({
    where,
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ coupons });
}
