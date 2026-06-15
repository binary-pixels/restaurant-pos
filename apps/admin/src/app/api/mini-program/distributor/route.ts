import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate referral code if not set
  if (!customer.referralCode) {
    const code = token.slice(-4) + Math.random().toString(36).slice(2, 6).toUpperCase();
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { referralCode: code } });
  }

  // Get commission history
  const commissions = await prisma.commission.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get referred customers count
  const referralCount = await prisma.customer.count({ where: { referredBy: customer.referralCode } });

  return NextResponse.json({
    referralCode: customer.referralCode,
    isDistributor: customer.isDistributor,
    commissionRate: customer.commissionRate,
    totalCommission: customer.totalCommission,
    referralCount,
    commissions: commissions.map((c) => ({
      orderAmount: c.orderAmount,
      rate: c.rate,
      amount: c.amount,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Toggle distributor status
  await prisma.customer.update({
    where: { id: customer.id },
    data: { isDistributor: true },
  });

  return NextResponse.json({ success: true, message: "已成为分销员，佣金率 " + customer.commissionRate + "%" });
}
