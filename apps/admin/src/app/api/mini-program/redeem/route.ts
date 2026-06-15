import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json();
  const { code } = body;
  if (!code) return NextResponse.json({ error: "请输入兑换码" }, { status: 400 });

  const giftCode = await prisma.giftCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!giftCode) return NextResponse.json({ error: "兑换码无效" }, { status: 400 });
  if (giftCode.isUsed) return NextResponse.json({ error: "该兑换码已被使用" }, { status: 400 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as used and add balance
  await prisma.giftCode.update({
    where: { id: giftCode.id },
    data: { isUsed: true, usedBy: customer.id, usedAt: new Date() },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { balance: { increment: giftCode.amount } },
  });

  return NextResponse.json({ success: true, amount: giftCode.amount, message: "兑换成功！余额 +¥" + giftCode.amount });
}
