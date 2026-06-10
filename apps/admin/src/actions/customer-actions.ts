"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers(storeId: string) {
  return prisma.customer.findMany({
    where: { storeId },
    include: { _count: { select: { orders: true } } },
    orderBy: { totalSpent: "desc" },
  });
}

export async function getCustomerDetail(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        include: { payments: true, items: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      credits: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function topUpBalance(customerId: string, amount: number, note?: string) {
  if (amount <= 0) throw new Error("Invalid amount");
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { balance: { increment: amount }, totalSpent: { increment: amount } },
  });

  // Record as credit
  await prisma.credit.create({
    data: { customerId, type: "GRANT", amount, balance: customer.balance, note: note || "余额充值" },
  });

  revalidatePath("/[locale]/marketing/members");
  return customer;
}

export async function adjustPoints(customerId: string, points: number, note?: string) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { points: { increment: points } },
  });

  await prisma.credit.create({
    data: { customerId, type: "GRANT", amount: points, balance: customer.points, note: note || "积分调整" },
  });

  revalidatePath("/[locale]/marketing/members");
  return customer;
}

export async function updateCustomerTier(customerId: string, tier: string) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { tier },
  });
  revalidatePath("/[locale]/marketing/members");
  return customer;
}

export async function createCustomer(data: { storeId: string; name: string; phone: string }) {
  const customer = await prisma.customer.create({
    data: { storeId: data.storeId, name: data.name, phone: data.phone },
  });
  revalidatePath("/[locale]/marketing/members");
  return customer;
}
