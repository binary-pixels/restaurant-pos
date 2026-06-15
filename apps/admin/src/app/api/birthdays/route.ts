import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  // Customers with birthday this month
  const all = await prisma.customer.findMany({
    where: { storeId: session.user.storeId, birthday: { not: null } },
    select: { id: true, name: true, phone: true, birthday: true },
    orderBy: { birthday: "asc" },
  });

  const thisMonth = all.filter((c) => c.birthday?.slice(5, 7) === currentMonth);

  return NextResponse.json({ thisMonth, all });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId } = body;
  if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Send birthday coupon
  await prisma.coupon.create({
    data: {
      storeId: session.user.storeId,
      customerId: customer.id,
      code: "BDAY-" + Date.now().toString(36).toUpperCase(),
      type: "FIXED_DISCOUNT",
      value: 20,
      minSpend: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      usageLimit: 1,
    },
  });

  return NextResponse.json({ success: true, message: "已发送生日优惠券 ¥20" });
}
