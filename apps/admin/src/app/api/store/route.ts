import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await prisma.store.update({
    where: { id: session.user.storeId },
    data: {
      name: body.name,
      address: body.address,
      phone: body.phone,
    },
  });

  return NextResponse.json({ success: true });
}
