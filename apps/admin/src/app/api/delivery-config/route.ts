import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Default delivery settings
const DEFAULTS = { deliveryFee: 5, freeDeliveryMin: 50, maxDistance: 5, autoDispatch: true };

export async function GET() {
  const config = await prisma.storeConfig.findFirst({
    where: { key: "delivery_config" },
  });
  return NextResponse.json(config ? JSON.parse(config.value) : DEFAULTS);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const value = JSON.stringify({ ...DEFAULTS, ...body });

  await prisma.storeConfig.upsert({
    where: { storeId_key: { storeId: session.user.storeId, key: "delivery_config" } },
    update: { value },
    create: { storeId: session.user.storeId, key: "delivery_config", value },
  });

  return NextResponse.json({ success: true });
}
