import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = req.nextUrl.searchParams.get("weekStart") || new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const schedules = await prisma.schedule.findMany({
    where: { storeId: session.user.storeId, date: { gte: weekStart, lt: weekEnd } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const users = await prisma.user.findMany({ where: { storeId: session.user.storeId, isActive: true }, select: { id: true, name: true } });

  return NextResponse.json({ schedules, users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, userName, date, shift } = body;
  if (!userId || !date || !shift) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const schedule = await prisma.schedule.create({
    data: { storeId: session.user.storeId, userId, userName, date, shift, note: body.note || null },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.schedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
