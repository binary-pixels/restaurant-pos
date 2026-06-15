import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { storeId: session.user.storeId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { storeId: session.user.storeId, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (id) {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({ where: { storeId: session.user.storeId }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
