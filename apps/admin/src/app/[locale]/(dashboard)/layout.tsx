import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

type Props = { children: React.ReactNode };

export default async function DashboardLayout({ children }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
