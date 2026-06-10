import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount } = body;
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { balance: { increment: amount }, totalSpent: { increment: amount } },
  });

  await prisma.credit.create({
    data: { customerId: customer.id, type: "GRANT", amount, balance: updated.balance, note: "余额充值" },
  });

  return NextResponse.json({ balance: updated.balance });
}
