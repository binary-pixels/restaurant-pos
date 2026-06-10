import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNo } from "@pos/shared";

export async function POST(req: NextRequest) {
  const body = await req.json();
  let { storeId, tableId, type, items, note, guestCount, address, contactName, contactPhone } = body;

  // Combine delivery address into note
  if (type === "DELIVERY" && address) {
    note = (note ? note + " | " : "") + "地址:" + address;
    if (contactName) note += " 联系人:" + contactName;
    if (contactPhone) note += " 电话:" + contactPhone;
  }

  // Fallback to first store if not provided (same as menu API)
  if (!storeId) {
    const firstStore = await prisma.store.findFirst();
    if (!firstStore) return NextResponse.json({ error: "No store" }, { status: 400 });
    storeId = firstStore.id;
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.order.count({
    where: { storeId, createdAt: { gte: today } },
  });
  const orderNo = generateOrderNo(new Date(), todayCount + 1);

  // Link customer if phone/token provided
  const customerPhone = body.customerPhone || body.token;
  let customerId: string | null = null;
  if (customerPhone) {
    const customer = await prisma.customer.findFirst({ where: { phone: customerPhone } });
    if (customer) customerId = customer.id;
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      storeId,
      orderNo,
      type: type || "DINE_IN",
      tableId: tableId || null,
      customerId,
      cashierId: null,
      subtotal,
      total: subtotal,
      guestCount: guestCount || 1,
      note: note || null,
      status: "PENDING",
      items: {
        create: items.map((item: any, i: number) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specSnapshot: item.specSnapshot || null,
          subtotal: item.unitPrice * item.quantity,
          sortOrder: i,
        })),
      },
    },
  });

  // Decrement stock for each item
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  if (tableId) {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: "OCCUPIED" },
    });
  }

  // Audit
  await prisma.auditLog.create({
    data: {
      storeId,
      userId: "小程序",
      action: "order.create",
      entity: "Order",
      entityId: order.id,
    },
  });

  return NextResponse.json({ id: order.id, orderNo: order.orderNo });
}
