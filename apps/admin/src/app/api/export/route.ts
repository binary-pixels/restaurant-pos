import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function toCSV(rows: any[], cols: string[]): string {
  const header = cols.join(",");
  const data = rows.map((r) => cols.map((c) => {
    const val = String(r[c] ?? "");
    return val.includes(",") ? '"' + val.replace(/"/g, '""') + '"' : val;
  }).join(","));
  return "\uFEFF" + header + "\n" + data.join("\n");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = req.nextUrl.searchParams.get("table") || "orders";
  const storeId = session.user.storeId;

  let csv = "";
  let filename = "";

  switch (table) {
    case "orders": {
      const orders = await prisma.order.findMany({
        where: { storeId },
        include: { table: { select: { label: true } }, cashier: { select: { name: true } }, customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      csv = toCSV(orders.map((o) => ({
        orderNo: o.orderNo, type: o.type, status: o.status, tableLabel: o.table?.label || "",
        customerName: o.customer?.name || "", total: o.total, isPaid: o.isPaid, createdAt: o.createdAt.toISOString(),
      })), ["orderNo", "type", "status", "tableLabel", "customerName", "total", "isPaid", "createdAt"]);
      filename = "orders.csv";
      break;
    }
    case "customers": {
      const customers = await prisma.customer.findMany({ where: { storeId }, orderBy: { createdAt: "desc" } });
      csv = toCSV(customers.map((c) => ({
        name: c.name || "", phone: c.phone || "", tier: c.tier, points: c.points,
        balance: c.balance, totalSpent: c.totalSpent, visitCount: c.visitCount, createdAt: c.createdAt.toISOString(),
      })), ["name", "phone", "tier", "points", "balance", "totalSpent", "visitCount", "createdAt"]);
      filename = "customers.csv";
      break;
    }
    case "products": {
      const products = await prisma.product.findMany({ where: { storeId }, include: { category: { select: { name: true } } }, orderBy: { sortOrder: "asc" } });
      csv = toCSV(products.map((p) => ({
        name: p.name, category: p.category.name, price: p.price, costPrice: p.costPrice || "",
        stock: p.stock, unit: p.unit, isActive: p.isActive,
      })), ["name", "category", "price", "costPrice", "stock", "unit", "isActive"]);
      filename = "products.csv";
      break;
    }
    case "payments": {
      const payments = await prisma.payment.findMany({
        where: { order: { storeId } },
        include: { order: { select: { orderNo: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      csv = toCSV(payments.map((p) => ({
        orderNo: p.order.orderNo, method: p.method, amount: p.amount,
        status: p.status, paidAt: p.paidAt?.toISOString() || "",
      })), ["orderNo", "method", "amount", "status", "paidAt"]);
      filename = "payments.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=" + filename,
    },
  });
}
