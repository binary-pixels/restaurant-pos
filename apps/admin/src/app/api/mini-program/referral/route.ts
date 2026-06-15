import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get my referral code
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate referral code if not exists
  if (!customer.referralCode) {
    const code = token.slice(-4) + Math.random().toString(36).slice(2, 6).toUpperCase();
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { referralCode: code } });
  }

  // Count successful referrals
  const referralCount = await prisma.customer.count({ where: { referredBy: customer.referralCode } });

  return NextResponse.json({ referralCode: customer.referralCode, referralCount });
}

// Apply referral code (called by new customer)
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json();
  const { code } = body;
  if (!code) return NextResponse.json({ error: "请输入推荐码" }, { status: 400 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Don't refer yourself
  if (customer.referralCode === code) return NextResponse.json({ error: "不能使用自己的推荐码" }, { status: 400 });
  // Already referred
  if (customer.referredBy) return NextResponse.json({ error: "已使用过推荐码" }, { status: 400 });

  const referrer = await prisma.customer.findFirst({ where: { referralCode: code } });
  if (!referrer) return NextResponse.json({ error: "推荐码无效" }, { status: 400 });

  // Apply referral
  await prisma.customer.update({ where: { id: customer.id }, data: { referredBy: code } });

  // Award both: 50 points to new customer, 50 points to referrer
  await prisma.customer.update({ where: { id: customer.id }, data: { points: { increment: 50 } } });
  await prisma.customer.update({ where: { id: referrer.id }, data: { points: { increment: 50 } } });

  return NextResponse.json({ success: true, message: "推荐成功，双方各获50积分！" });
}
