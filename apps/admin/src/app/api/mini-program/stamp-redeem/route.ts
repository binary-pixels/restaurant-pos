import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = await prisma.storeConfig.findFirst({ where: { key: "stamp_config" } });
  const cfg = config ? JSON.parse(config.value) : { threshold: 10, reward: 10 };

  if (customer.stamps < cfg.threshold) {
    return NextResponse.json({ error: "印章不足，还需" + (cfg.threshold - customer.stamps) + "枚" }, { status: 400 });
  }

  // Deduct stamps and issue reward coupon
  await prisma.customer.update({
    where: { id: customer.id },
    data: { stamps: customer.stamps - cfg.threshold },
  });

  await prisma.coupon.create({
    data: {
      storeId: customer.storeId || "",
      customerId: customer.id,
      code: "STAMP-" + Date.now().toString(36).toUpperCase(),
      type: "FIXED_DISCOUNT",
      value: cfg.reward,
      minSpend: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      usageLimit: 1,
    },
  });

  return NextResponse.json({ success: true });
}
