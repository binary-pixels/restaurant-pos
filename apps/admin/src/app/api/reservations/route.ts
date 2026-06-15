import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservations = await prisma.reservation.findMany({
    where: { storeId: session.user.storeId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ reservations });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;
  await prisma.reservation.update({ where: { id }, data: { status } });

  // If confirmed, set table to RESERVED
  if (status === "CONFIRMED") {
    const resv = await prisma.reservation.findUnique({ where: { id } });
    if (resv?.tableId) {
      await prisma.table.update({ where: { id: resv.tableId }, data: { status: "RESERVED" } });
    }
  }

  return NextResponse.json({ success: true });
}
