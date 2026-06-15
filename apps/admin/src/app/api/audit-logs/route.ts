import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = req.nextUrl.searchParams.get("action") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");

  const where: any = { storeId: session.user.storeId };
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const actionLabels: Record<string, string> = {
    "order.create": "创建订单",
    "order.cancel": "取消订单",
    "order.refund": "退款",
    "order.close": "结单",
    "payment.create": "收款",
    "order.update": "更新订单",
  };

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: actionLabels[l.action] || l.action,
      actionKey: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / 50),
  });
}
