import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  let storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    const firstStore = await prisma.store.findFirst();
    if (!firstStore) return NextResponse.json({ error: "No store" }, { status: 400 });
    storeId = firstStore.id;
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId, isActive: true },
      include: { specs: { include: { options: true } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return NextResponse.json({ categories, products });
}
