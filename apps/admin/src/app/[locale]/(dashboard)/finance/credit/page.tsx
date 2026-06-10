import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CreditManager } from "@/components/finance/credit-manager";

export default async function CreditPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const customers = await prisma.customer.findMany({
    where: { storeId: session.user.storeId },
    include: {
      credits: { orderBy: { createdAt: "desc" } },
      _count: { select: { orders: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate stats
  const withDebt = customers.filter((c) => {
    const balance = c.credits.reduce((sum: number, cr: { type: string; amount: number }) => {
      if (cr.type === "GRANT") return sum + cr.amount;
      if (cr.type === "REPAY") return sum - cr.amount;
      return sum;
    }, 0);
    return balance > 0;
  });

  const totalDebt = withDebt.reduce((sum: number, c) => {
    return sum + c.credits.reduce((s: number, cr: { type: string; amount: number }) => {
      if (cr.type === "GRANT") return s + cr.amount;
      if (cr.type === "REPAY") return s - cr.amount;
      return s;
    }, 0);
  }, 0);

  return (
    <div>
      <PageHeader
        title="挂账管理"
        description={`${customers.length} 位客户，${withDebt.length} 位待还款，欠款 ¥${totalDebt.toFixed(2)}`}
      />
      <CreditManager customers={customers} storeId={session.user.storeId} />
    </div>
  );
}
