import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { MenuManager } from "@/components/menu/menu-manager";

export default async function MenuPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const t = await getTranslations("products");

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: session.user.storeId },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId: session.user.storeId },
      include: {
        category: { select: { name: true } },
        specs: { include: { options: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <div>
      <PageHeader title={t("title")} />
      <MenuManager
        categories={categories}
        products={products}
        storeId={session.user.storeId}
      />
    </div>
  );
}
