import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: list all codes
export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await prisma.giftCode.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ codes });
}

// POST: generate batch
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount, count } = body;
  if (!amount || amount <= 0 || !count || count <= 0 || count > 100) {
    return NextResponse.json({ error: "Invalid: amount>0, count 1-100" }, { status: 400 });
  }

  const codes: any[] = [];
  for (let i = 0; i < count; i++) {
    const code = "GC" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const gc = await prisma.giftCode.create({
      data: { storeId: session.user.storeId, code, amount },
    });
    codes.push(gc);
  }

  return NextResponse.json({ codes });
}
