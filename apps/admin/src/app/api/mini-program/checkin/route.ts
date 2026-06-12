import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get this month's check-ins
  const now = new Date();
  const monthStart = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01";
  const checkIns = await prisma.checkIn.findMany({
    where: { customerId: customer.id, date: { gte: monthStart } },
    orderBy: { date: "desc" },
  });

  // Calculate streak
  const today = now.toISOString().slice(0, 10);
  const todayChecked = checkIns.some((c) => c.date === today);
  let streak = 0;
  const d = new Date(now);
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (checkIns.some((c) => c.date === dateStr)) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }

  return NextResponse.json({
    checkedToday: todayChecked,
    streak,
    totalPoints: customer.points,
    checkIns: checkIns.map((c) => ({ date: c.date, points: c.points })),
  });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const existing = await prisma.checkIn.findUnique({
    where: { customerId_date: { customerId: customer.id, date: today } },
  });
  if (existing) return NextResponse.json({ error: "Already checked in today" }, { status: 400 });

  // Bonus points for streaks: 1 point base + 1 bonus every 7 days
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const yesterdayCheck = await prisma.checkIn.findUnique({
    where: { customerId_date: { customerId: customer.id, date: yesterdayStr } },
  });

  const prevCheckIns = await prisma.checkIn.findMany({
    where: { customerId: customer.id },
    orderBy: { date: "desc" },
    take: 7,
  });

  let streak = 1;
  const check = new Date();
  for (let i = 0; i < prevCheckIns.length; i++) {
    check.setDate(check.getDate() - 1);
    const expected = check.toISOString().slice(0, 10);
    if (prevCheckIns.some((c) => c.date === expected)) streak++;
    else break;
  }

  const points = streak % 7 === 0 ? 5 : 1; // bonus on 7th day

  const checkIn = await prisma.checkIn.create({
    data: { customerId: customer.id, date: today, points },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { points: { increment: points } },
  });

  return NextResponse.json({ ...checkIn, streak, totalPoints: customer.points + points });
}
