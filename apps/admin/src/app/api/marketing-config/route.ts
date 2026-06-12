import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { key, ...rest } = body;
  await prisma.storeConfig.upsert({
    where: { storeId_key: { storeId: session.user.storeId, key } },
    update: { value: JSON.stringify(rest) },
    create: { storeId: session.user.storeId, key, value: JSON.stringify(rest) },
  });
  return NextResponse.json({ success: true });
}
