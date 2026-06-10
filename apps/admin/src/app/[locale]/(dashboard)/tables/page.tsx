import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { TableManager } from "@/components/tables/table-manager";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const t = await getTranslations("tables");

  const zones = await prisma.zone.findMany({
    where: { storeId: session.user.storeId },
    include: {
      tables: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader title={t("title")} />
      <TableManager zones={zones} storeId={session.user.storeId} />
    </div>
  );
}
