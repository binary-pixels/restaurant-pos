"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProcurement(data: {
  storeId: string;
  supplier: string;
  items: { productName: string; quantity: number; unitCost: number }[];
  note?: string;
}) {
  const totalCost = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const order = await prisma.procurement.create({
    data: {
      storeId: data.storeId,
      supplier: data.supplier,
      totalCost,
      note: data.note || null,
      status: "PENDING",
      items: {
        create: data.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
    include: { items: true },
  });

  revalidatePath("/[locale]/menu/procurement");
  return order;
}

export async function getProcurements(storeId: string) {
  return prisma.procurement.findMany({
    where: { storeId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateProcurementStatus(id: string, status: string) {
  await prisma.procurement.update({ where: { id }, data: { status } });
  revalidatePath("/[locale]/menu/procurement");
}

export async function deleteProcurement(id: string) {
  await prisma.procurement.delete({ where: { id } });
  revalidatePath("/[locale]/menu/procurement");
}
