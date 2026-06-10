"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCoupon(data: {
  storeId: string;
  code: string;
  type: string;
  value: number;
  minSpend?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
}) {
  const coupon = await prisma.coupon.create({
    data: {
      storeId: data.storeId,
      code: data.code,
      type: data.type,
      value: data.value,
      minSpend: data.minSpend || 0,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      usageLimit: data.usageLimit || 100,
    },
  });
  revalidatePath("/[locale]/marketing/coupons");
  return coupon;
}

export async function getCoupons(storeId: string) {
  return prisma.coupon.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/[locale]/marketing/coupons");
}

export async function toggleCoupon(id: string, isActive: boolean) {
  await prisma.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/[locale]/marketing/coupons");
}
