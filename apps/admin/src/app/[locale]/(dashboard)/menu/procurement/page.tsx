import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProcurementManager } from "@/components/menu/procurement-manager";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const orders = await prisma.procurement.findMany({
    where: { storeId: session.user.storeId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const total = orders.reduce((s, o) => s + o.totalCost, 0);

  return (
    <div>
      <PageHeader title="进销存管理" description={"本月采购 ¥" + total.toFixed(2)} />
      <ProcurementManager orders={orders} storeId={session.user.storeId} />
    </div>
  );
}
