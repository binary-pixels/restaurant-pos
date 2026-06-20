import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const existing = await prisma.category.findFirst({ where: { storeId: session.user.storeId, name } });
  if (existing) return NextResponse.json(existing);

  const category = await prisma.category.create({ data: { storeId: session.user.storeId, name } });
  return NextResponse.json(category);
}
