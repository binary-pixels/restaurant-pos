import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getCustomerId(req: NextRequest): string | null {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  return token || null;
}

export async function GET(req: NextRequest) {
  const phone = getCustomerId(req);
  if (!phone) return NextResponse.json({ addresses: [] });

  const customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) return NextResponse.json({ addresses: [] });

  const addresses = await prisma.deliveryAddress.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const phone = getCustomerId(req);
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { label, address, contactName, contactPhone, isDefault } = body;

  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  // If setting as default, unset others
  if (isDefault) {
    await prisma.deliveryAddress.updateMany({
      where: { customerId: customer.id },
      data: { isDefault: false },
    });
  }

  // Auto-set first address as default
  const count = await prisma.deliveryAddress.count({ where: { customerId: customer.id } });

  const addr = await prisma.deliveryAddress.create({
    data: {
      customerId: customer.id,
      label: label || "",
      address,
      contactName: contactName || "",
      phone: contactPhone || phone,
      isDefault: isDefault || count === 0,
    },
  });

  return NextResponse.json(addr);
}

export async function PUT(req: NextRequest) {
  const phone = getCustomerId(req);
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, label, address, contactName, contactPhone, isDefault } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (isDefault) {
    const existing = await prisma.deliveryAddress.findUnique({ where: { id } });
    if (existing) {
      await prisma.deliveryAddress.updateMany({
        where: { customerId: existing.customerId },
        data: { isDefault: false },
      });
    }
  }

  const updated = await prisma.deliveryAddress.update({
    where: { id },
    data: { label, address, contactName, phone: contactPhone, isDefault },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const phone = getCustomerId(req);
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.deliveryAddress.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
