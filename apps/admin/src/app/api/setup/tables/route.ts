import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const count = body.count || 12;

  // Create default zone if none exists
  let zone = await prisma.zone.findFirst({ where: { storeId: session.user.storeId } });
  if (!zone) {
    zone = await prisma.zone.create({ data: { storeId: session.user.storeId, name: "一楼大厅" } });
  }

  const tables = [];
  for (let i = 1; i <= count; i++) {
    const label = "A" + String(i).padStart(2, "0");
    const existing = await prisma.table.findFirst({ where: { zoneId: zone.id, label } });
    if (!existing) {
      const t = await prisma.table.create({
        data: { zoneId: zone.id, label, capacity: i <= 8 ? 4 : 8, sortOrder: i },
      });
      tables.push(t);
    }
  }

  return NextResponse.json({ created: tables.length });
}
