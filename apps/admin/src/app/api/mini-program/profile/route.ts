import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // In production: authenticate via token → customerId
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({
    where: { phone: token },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    tier: customer.tier,
    points: customer.points,
    balance: customer.balance,
    totalSpent: customer.totalSpent,
    visitCount: customer.visitCount,
  });
}
