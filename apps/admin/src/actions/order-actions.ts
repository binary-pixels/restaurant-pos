"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateOrderNo } from "@pos/shared";

type CreateOrderInput = {
  storeId: string;
  type: string;
  tableId?: string;
  customerId?: string;
  cashierId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    specSnapshot?: string;
    note?: string;
  }[];
  discount?: {
    type: string;
    name: string;
    value: number;
  };
  note?: string;
  guestCount?: number;
};

export async function createOrder(input: CreateOrderInput) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.order.count({
    where: { storeId: input.storeId, createdAt: { gte: today } },
  });
  const orderNo = generateOrderNo(new Date(), todayCount + 1);

  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  let discountTotal = 0;
  if (input.discount) {
    discountTotal = input.discount.type === "PERCENTAGE"
      ? subtotal * (input.discount.value / 100)
      : input.discount.value;
  }
  const total = Math.max(0, subtotal - discountTotal);

  const order = await prisma.order.create({
    data: {
      storeId: input.storeId,
      orderNo,
      type: input.type,
      status: "PENDING",
      tableId: input.tableId || null,
      customerId: input.customerId || null,
      cashierId: input.cashierId,
      subtotal,
      discountTotal,
      total,
      guestCount: input.guestCount || 1,
      note: input.note || null,
      items: {
        create: input.items.map((item, i) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specSnapshot: item.specSnapshot || null,
          subtotal: item.unitPrice * item.quantity,
          note: item.note || null,
          sortOrder: i,
        })),
      },
      discounts: input.discount ? {
        create: { type: input.discount.type, name: input.discount.name, amount: discountTotal, createdBy: input.cashierId },
      } : undefined,
    },
    include: { table: { select: { label: true } }, items: true, payments: true },
  });

  // Decrement stock
  for (const item of input.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  if (input.tableId) {
    await prisma.table.update({ where: { id: input.tableId }, data: { status: "OCCUPIED" } });
  }

  // Audit log
  await prisma.auditLog.create({
    data: { storeId: input.storeId, userId: input.cashierId, action: "order.create", entity: "Order", entityId: order.id },
  });

  revalidatePath("/[locale]/pos", "page");
  revalidatePath("/[locale]/", "page");
  return order;
}

export async function payOrder(input: { orderId: string; method: string; amount: number }) {
  const payment = await prisma.payment.create({
    data: { orderId: input.orderId, method: input.method, amount: input.amount, status: "SUCCESS", paidAt: new Date() },
  });

  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { payments: true } });
  if (!order) throw new Error("Order not found");

  const totalPaid = order.payments.reduce((sum: number, p: { status: string; amount: number }) => {
    if (p.status === "SUCCESS") return sum + p.amount;
    return sum;
  }, 0) + (payment.status === "SUCCESS" ? payment.amount : 0);

  const isFullyPaid = totalPaid >= order.total;

  await prisma.order.update({
    where: { id: input.orderId },
    data: { paidAmount: totalPaid, isPaid: isFullyPaid, status: isFullyPaid ? "CONFIRMED" : order.status },
  });

  await prisma.auditLog.create({
    data: { storeId: order.storeId, userId: order.cashierId || "system", action: "payment.create", entity: "Payment", entityId: payment.id },
  });

  revalidatePath("/[locale]/pos", "page");
  revalidatePath("/[locale]/", "page");
  return payment;
}

export async function closeOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) throw new Error("Order not found");

  const totalPaid = order.payments
    .filter((p: { status: string }) => p.status === "SUCCESS")
    .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
  const changeAmount = Math.max(0, totalPaid - order.total);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      isClosed: true, isPaid: totalPaid >= order.total,
      changeAmount, closedAt: new Date(),
      status: totalPaid >= order.total ? "COMPLETED" : order.status,
    },
  });

  if (order.tableId) {
    await prisma.table.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
  }

  if (order.customerId) {
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { totalSpent: { increment: order.total }, visitCount: { increment: 1 }, lastVisitAt: new Date(), points: { increment: Math.floor(order.total) } },
    });
  }

  await prisma.auditLog.create({
    data: { storeId: order.storeId, userId: "system", action: "order.close", entity: "Order", entityId: orderId },
  });

  revalidatePath("/[locale]/pos", "page");
  revalidatePath("/[locale]/", "page");
  return updated;
}

// Order cancellation and refund
export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED", isClosed: true, closedAt: new Date() },
  });

  if (order.tableId) {
    await prisma.table.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
  }

  await prisma.auditLog.create({
    data: { storeId: order.storeId, userId: "system", action: "order.cancel", entity: "Order", entityId: orderId },
  });

  revalidatePath("/[locale]/orders");
  return updated;
}

export async function refundOrder(orderId: string) {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "REFUNDED", isClosed: true, closedAt: new Date(), isPaid: false },
  });

  // Refund all payments
  await prisma.payment.updateMany({
    where: { orderId, status: "SUCCESS" },
    data: { status: "REFUNDED" },
  });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order?.tableId) {
    await prisma.table.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
  }

  await prisma.auditLog.create({
    data: { storeId: order?.storeId || "", userId: "system", action: "order.refund", entity: "Order", entityId: orderId },
  });

  revalidatePath("/[locale]/orders");
  return updated;
}
