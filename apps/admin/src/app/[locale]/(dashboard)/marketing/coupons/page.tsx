import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CouponManager } from "@/components/marketing/coupon-manager";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const coupons = await prisma.coupon.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="优惠券管理" description={coupons.length + " 张优惠券"} />
      <CouponManager coupons={coupons} storeId={session.user.storeId} />
    </div>
  );
}
