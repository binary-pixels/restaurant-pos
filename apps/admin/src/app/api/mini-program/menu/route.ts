import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  let storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    const firstStore = await prisma.store.findFirst();
    if (!firstStore) return NextResponse.json({ error: "No store" }, { status: 400 });
    storeId = firstStore.id;
  }

  const [categories, products, deliveryConfig, newCustomerConfig, volumeDiscConfig] = await Promise.all([
    prisma.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId, isActive: true },
      include: { specs: { include: { options: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.storeConfig.findFirst({ where: { storeId, key: "delivery_config" } }),
    prisma.storeConfig.findFirst({ where: { storeId, key: "new_customer_discount" } }),
    prisma.storeConfig.findFirst({ where: { storeId, key: "volume_discount" } }),
  ]);

  const delivery = deliveryConfig ? JSON.parse(deliveryConfig.value) : { deliveryFee: 5, freeDeliveryMin: 50, maxDistance: 5 };
  const newCustomer = newCustomerConfig ? JSON.parse(newCustomerConfig.value) : { enabled: false, amount: 5 };
  const volumeDiscount = volumeDiscConfig ? JSON.parse(volumeDiscConfig.value) : { enabled: false, type: "amount", threshold: 3, value: 20 };

  return NextResponse.json({ categories, products, delivery, newCustomer, volumeDiscount });
}
