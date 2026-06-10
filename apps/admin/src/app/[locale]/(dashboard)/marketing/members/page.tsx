import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MemberList } from "@/components/marketing/member-list";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const customers = await prisma.customer.findMany({
    where: { storeId: session.user.storeId },
    include: { _count: { select: { orders: true } } },
    orderBy: { totalSpent: "desc" },
  });

  const stats = {
    total: customers.length,
    gold: customers.filter((c) => c.tier === "GOLD" || c.tier === "DIAMOND").length,
    totalPoints: customers.reduce((s, c) => s + c.points, 0),
    totalBalance: customers.reduce((s, c) => s + c.balance, 0),
  };

  return (
    <div>
      <PageHeader title="会员管理" description={`${stats.total} 位会员`} />
      <MemberList customers={customers} stats={stats} storeId={session.user.storeId} />
    </div>
  );
}
