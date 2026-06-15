import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List active groups
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId") || "";
  const where: any = { status: "ACTIVE", expiresAt: { gte: new Date() } };
  if (storeId) where.storeId = storeId;

  const groups = await prisma.groupBuy.findMany({
    where,
    include: { members: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    groups: groups.map((g) => ({
      id: g.id,
      productName: g.productName,
      price: g.price,
      origPrice: g.origPrice,
      minPeople: g.minPeople,
      memberCount: g.members.length,
      expiresAt: g.expiresAt.toISOString(),
    })),
  });
}

// Create a new group
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  const body = await req.json();
  const { productId, productName, price, origPrice, minPeople, storeId } = body;

  if (!productId || !productName || !price) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const customer = token ? await prisma.customer.findFirst({ where: { phone: token } }) : null;

  const group = await prisma.groupBuy.create({
    data: {
      storeId: storeId || "",
      productId,
      productName,
      price,
      origPrice: origPrice || price,
      minPeople: minPeople || 2,
      expiresAt: new Date(Date.now() + 24 * 3600000),
      members: customer ? { create: { customerId: customer.id } } : undefined,
    },
    include: { members: true },
  });

  return NextResponse.json({ id: group.id, memberCount: group.members.length });
}

// Join an existing group
export async function PUT(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone: token } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { groupId } = body;
  if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });

  const group = await prisma.groupBuy.findUnique({ where: { id: groupId }, include: { members: true } });
  if (!group) return NextResponse.json({ error: "拼团不存在" }, { status: 404 });
  if (group.status !== "ACTIVE") return NextResponse.json({ error: "拼团已结束" }, { status: 400 });

  // Check not already joined
  if (group.members.some((m) => m.customerId === customer.id)) {
    return NextResponse.json({ error: "已加入该团" }, { status: 400 });
  }

  await prisma.groupBuyMember.create({ data: { groupId, customerId: customer.id } });

  const updated = await prisma.groupBuy.findUnique({ where: { id: groupId }, include: { members: true } });
  const filled = updated && updated.members.length >= updated.minPeople;

  return NextResponse.json({ memberCount: updated?.members.length || 1, filled });
}
