import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PrinterManager } from "@/components/settings/printer-manager";

export const dynamic = "force-dynamic";

export default async function PrintersPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  let devices = await prisma.device.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
  });

  // Auto-seed if empty
  if (devices.length === 0) {
    await prisma.device.createMany({
      data: [
        { storeId: session.user.storeId, name: "前台打印机", type: "PRINTER_THERMAL", connection: "NETWORK", ip: "192.168.1.100", port: 9100, status: "online" },
        { storeId: session.user.storeId, name: "后厨打印机A", type: "PRINTER_KITCHEN", connection: "NETWORK", ip: "192.168.1.101", port: 9100, status: "online" },
      ],
    });
    devices = await prisma.device.findMany({
      where: { storeId: session.user.storeId },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div>
      <PageHeader title="打印机设置" description={devices.length + " 台设备"} />
      <PrinterManager devices={devices} storeId={session.user.storeId} />
    </div>
  );
}
