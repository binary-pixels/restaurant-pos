import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { UserManager } from "@/components/users/user-manager";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const [users, tags] = await Promise.all([
    prisma.user.findMany({
      where: { storeId: session.user.storeId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { storeId: session.user.storeId },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="用户管理"
        description={`共 ${users.length} 名用户`}
      />
      <UserManager users={users} tags={tags} storeId={session.user.storeId} />
    </div>
  );
}
