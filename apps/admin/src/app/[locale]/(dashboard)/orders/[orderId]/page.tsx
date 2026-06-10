import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { OrderDetail } from "@/components/orders/order-detail";

type Props = { params: { orderId: string } };

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: { include: { product: true } },
      payments: true,
      discounts: true,
      table: { select: { label: true } },
      cashier: { select: { name: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  if (!order) {
    return <div className="text-center py-12 text-gray-500">订单不存在</div>;
  }

  return (
    <div>
      <PageHeader title={`订单 ${order.orderNo}`} />
      <OrderDetail order={order} />
    </div>
  );
}
