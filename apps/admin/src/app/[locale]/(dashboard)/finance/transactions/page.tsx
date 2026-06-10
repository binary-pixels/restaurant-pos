import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionsList } from "@/components/finance/transactions-list";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  // All payments for this store (via order)
  const orders = await prisma.order.findMany({
    where: { storeId: session.user.storeId },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  const payments = await prisma.payment.findMany({
    where: { orderId: { in: orderIds } },
    include: {
      order: { select: { orderNo: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader title="账单查询" description="所有收款和操作记录" />
      <TransactionsList payments={payments} auditLogs={auditLogs} />
    </div>
  );
}
