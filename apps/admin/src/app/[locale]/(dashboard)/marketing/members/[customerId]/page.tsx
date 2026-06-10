import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MemberDetail } from "@/components/marketing/member-detail";

type Props = { params: { customerId: string } };

export default async function MemberDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const customer = await prisma.customer.findUnique({
    where: { id: params.customerId },
    include: {
      orders: {
        include: { payments: true, items: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      credits: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) return <div className="text-center py-12 text-gray-500">会员不存在</div>;

  return (
    <div>
      <PageHeader title={`${customer.name || "未命名"} · 会员详情`} />
      <MemberDetail customer={customer} />
    </div>
  );
}
