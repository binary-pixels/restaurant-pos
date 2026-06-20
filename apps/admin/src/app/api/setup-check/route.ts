import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ completed: false });

  const [catCount, tableCount] = await Promise.all([
    prisma.category.count({ where: { storeId: session.user.storeId } }),
    prisma.table.count({ where: { zone: { storeId: session.user.storeId } } }),
  ]);

  return NextResponse.json({ completed: catCount > 0 && tableCount > 0 });
}
