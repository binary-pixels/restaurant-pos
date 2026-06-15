import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Revenue by payment method
  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS", paidAt: { gte: today, lt: tomorrow } },
    include: { order: { select: { storeId: true } } },
  });

  // Filter by store
  const storePayments = payments.filter((p) => p.order.storeId === session.user.storeId);

  const methodTotals: Record<string, number> = {};
  let totalRevenue = 0;
  for (const p of storePayments) {
    methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
    totalRevenue += p.amount;
  }

  // Today's refund and all-time balance
  const [orderCount, creditSummary, refundTotal, customerBalance] = await Promise.all([
    prisma.order.count({ where: { storeId: session.user.storeId, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.credit.aggregate({
      where: { customer: { storeId: session.user.storeId }, settledAt: null },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "REFUNDED", paidAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
    }),
    prisma.customer.aggregate({
      where: { storeId: session.user.storeId },
      _sum: { balance: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="收银管理" description="实时营收概览" />
      <FinanceDashboard
        methodTotals={methodTotals}
        totalRevenue={totalRevenue}
        orderCount={orderCount}
        totalDebt={creditSummary._sum.amount || 0}
        totalRefund={refundTotal._sum.amount || 0}
        totalCustomerBalance={customerBalance._sum.balance || 0}
      />
    </div>
  );
}
