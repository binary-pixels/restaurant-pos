import { prisma } from "@/lib/prisma";

export async function createNotification(storeId: string, type: string, title: string, message: string) {
  await prisma.notification.create({ data: { storeId, type, title, message } });
}

export async function notifyNewOrder(storeId: string, orderNo: string, tableLabel?: string | null) {
  const label = tableLabel || "外卖";
  await createNotification(storeId, "new_order", "新订单", label + " - " + orderNo);
}

export async function checkLowStock(storeId: string) {
  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: { name: true, stock: true, lowStockAt: true },
  });
  for (const p of products) {
    if (p.stock <= p.lowStockAt) {
      await createNotification(storeId, "low_stock", "库存不足", p.name + " 仅剩 " + p.stock + " 份");
    }
  }
}
