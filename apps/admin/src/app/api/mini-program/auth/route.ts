import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userInfo } = body;
  const phone = userInfo?.phone || ("mp_" + Date.now());

  // Find or create customer by phone
  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    const store = await prisma.store.findFirst();
    customer = await prisma.customer.create({
      data: {
        storeId: store?.id || "",
        name: userInfo?.name || "微信用户",
        phone,
        lastVisitAt: new Date(),
      },
    });
  } else {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastVisitAt: new Date() },
    });
  }

  return NextResponse.json({
    token: phone,
    user: {
      id: customer.id, name: customer.name,
      phone: customer.phone, tier: customer.tier, points: customer.points,
    },
  });
}
