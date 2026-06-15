import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ reservations: [] });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ reservations: [] });

  const reservations = await prisma.reservation.findMany({
    where: { customerId: customer.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  return NextResponse.json({ reservations });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const body = await req.json();
  const { name, phone, date, timeSlot, guests, note, tableLabel, storeId } = body;

  if (!name || !phone || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const customer = token ? await prisma.customer.findFirst({ where: { phone: token } }) : null;
  const store = storeId || (await prisma.store.findFirst())?.id || "";

  const reservation = await prisma.reservation.create({
    data: {
      storeId: store,
      customerId: customer?.id || null,
      tableLabel: tableLabel || "待安排",
      name, phone, date, timeSlot,
      guests: guests || 2,
      note: note || null,
    },
  });

  return NextResponse.json(reservation);
}
