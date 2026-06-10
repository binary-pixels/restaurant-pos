"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDevices(storeId: string) {
  return prisma.device.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDevice(data: {
  storeId: string;
  name: string;
  type: string;
  connection: string;
  ip?: string;
  port?: number;
}) {
  const device = await prisma.device.create({ data });
  revalidatePath("/[locale]/settings/printers");
  return device;
}

export async function updateDevice(id: string, data: {
  name?: string;
  ip?: string;
  port?: number;
  isActive?: boolean;
}) {
  const device = await prisma.device.update({ where: { id }, data });
  revalidatePath("/[locale]/settings/printers");
  return device;
}

export async function deleteDevice(id: string) {
  await prisma.device.delete({ where: { id } });
  revalidatePath("/[locale]/settings/printers");
}
