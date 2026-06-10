import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryList } from "@/components/menu/inventory-list";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const products = await prisma.product.findMany({
    where: { storeId: session.user.storeId },
    include: { category: { select: { name: true } } },
    orderBy: { stock: "asc" },
  });

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockAt).length;

  return (
    <div>
      <PageHeader
        title="库存管理"
        description={`共 ${products.length} 个商品，${lowStockCount} 个库存不足`}
      />
      <InventoryList products={products} storeId={session.user.storeId} />
    </div>
  );
}
