import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: list all (admin) or latest active (public)
export async function GET(req: NextRequest) {
  const isPublic = req.nextUrl.searchParams.get("public") === "1";

  if (isPublic) {
    const latest = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(latest ? { title: latest.title, content: latest.content } : null);
  }

  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await prisma.announcement.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content } = body;
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  const announcement = await prisma.announcement.create({
    data: { storeId: session.user.storeId, title, content },
  });

  return NextResponse.json(announcement);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, isActive } = body;
  await prisma.announcement.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
