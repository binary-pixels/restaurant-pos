import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRIZES = [
  { name: "5元优惠券", type: "coupon", value: 5, weight: 30 },
  { name: "10积分", type: "points", value: 10, weight: 30 },
  { name: "谢谢参与", type: "none", value: 0, weight: 20 },
  { name: "3元优惠券", type: "coupon", value: 3, weight: 10 },
  { name: "免配送费", type: "free_delivery", value: 0, weight: 5 },
  { name: "20积分", type: "points", value: 20, weight: 5 },
];

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const phone = token || "";
  const today = new Date().toISOString().slice(0, 10);

  // Check daily limit (1 spin per day)
  const todaySpins = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM CouponUsage WHERE createdAt >= ? AND createdAt < ?`,
    today, new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );

  const canSpin = true; // Allow multiple spins for demo

  // Load prizes from config or defaults
  const config = await prisma.storeConfig.findFirst({ where: { key: "lucky_wheel_prizes" } });
  const prizes = config ? JSON.parse(config.value) : DEFAULT_PRIZES;

  return NextResponse.json({ prizes: prizes.map((p: any) => ({ name: p.name, type: p.type, value: p.value })), canSpin });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load prizes
  const config = await prisma.storeConfig.findFirst({ where: { key: "lucky_wheel_prizes" } });
  const prizes: any[] = config ? JSON.parse(config.value) : DEFAULT_PRIZES;

  // Weighted random
  const totalWeight = prizes.reduce((s: number, p: any) => s + p.weight, 0);
  let rand = Math.random() * totalWeight;
  let selected = prizes[0];
  for (const p of prizes) {
    rand -= p.weight;
    if (rand <= 0) { selected = p; break; }
  }

  // Award the prize
  if (selected.type === "points") {
    await prisma.customer.update({ where: { id: customer.id }, data: { points: { increment: selected.value } } });
  } else if (selected.type === "coupon") {
    await prisma.coupon.create({
      data: {
        storeId: customer.storeId || "",
        customerId: customer.id,
        code: "WHEEL-" + Date.now().toString(36).toUpperCase(),
        type: "FIXED_DISCOUNT",
        value: selected.value,
        minSpend: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        usageLimit: 1,
      },
    });
    // Record usage for daily limit
    await prisma.couponUsage.create({ data: { couponId: "", orderId: null, orderNo: null, amount: 0 } });
  }

  return NextResponse.json({
    prize: { name: selected.name, type: selected.type, value: selected.value },
    index: prizes.indexOf(selected),
  });
}
