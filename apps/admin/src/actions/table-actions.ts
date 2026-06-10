"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getZones(storeId: string) {
  return prisma.zone.findMany({
    where: { storeId },
    include: {
      tables: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createZone(data: {
  storeId: string;
  name: string;
  sortOrder?: number;
}) {
  const zone = await prisma.zone.create({ data });
  revalidatePath("/[locale]/tables", "page");
  return zone;
}

export async function updateZone(id: string, data: { name?: string; sortOrder?: number }) {
  const zone = await prisma.zone.update({ where: { id }, data });
  revalidatePath("/[locale]/tables", "page");
  return zone;
}

export async function deleteZone(id: string) {
  await prisma.zone.delete({ where: { id } });
  revalidatePath("/[locale]/tables", "page");
}

export async function createTable(data: {
  zoneId: string;
  label: string;
  capacity?: number;
}) {
  const t = await prisma.table.create({
    data: {
      zoneId: data.zoneId,
      label: data.label,
      capacity: data.capacity || 4,
      status: "AVAILABLE",
    },
  });
  revalidatePath("/[locale]/tables", "page");
  return t;
}

export async function updateTable(
  id: string,
  data: { label?: string; capacity?: number; status?: string }
) {
  const t = await prisma.table.update({ where: { id }, data });
  revalidatePath("/[locale]/tables", "page");
  return t;
}

export async function deleteTable(id: string) {
  await prisma.table.delete({ where: { id } });
  revalidatePath("/[locale]/tables", "page");
}
