import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { QrCodeDisplay } from "@/components/tables/qrcode-display";

export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const zones = await prisma.zone.findMany({
    where: { storeId: session.user.storeId },
    include: {
      tables: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  return (
    <div>
      <PageHeader title="桌码生成" description="扫码点餐桌贴二维码" />
      <QrCodeDisplay zones={zones} baseUrl={baseUrl} storeId={session.user.storeId} />
    </div>
  );
}
