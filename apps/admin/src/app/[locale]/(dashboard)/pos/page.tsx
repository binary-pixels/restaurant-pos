import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PosScreen } from "@/components/pos/pos-screen";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const [zones, categories] = await Promise.all([
    prisma.zone.findMany({
      where: { storeId: session.user.storeId },
      include: {
        tables: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { storeId: session.user.storeId, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: { specs: { include: { options: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <PosScreen
      zones={zones}
      categories={categories}
      storeId={session.user.storeId}
      cashierId={session.user.id!}
    />
  );
}
