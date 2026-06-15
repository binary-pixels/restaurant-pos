import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { TicketPercent, Gift, Users, Sparkles, Timer, BadgePercent, Star } from "lucide-react";

const modules = [
  { href: "/marketing/coupons", label: "优惠券管理", desc: "满减券/折扣券/兑换券", icon: TicketPercent, color: "bg-blue-500" },
  { href: "/marketing", label: "限时折扣", desc: "商品限时特价活动", icon: Timer, color: "bg-red-500" },
  { href: "/marketing", label: "套餐推广", desc: "组合套餐优惠", icon: Gift, color: "bg-purple-500" },
  { href: "/marketing/members", label: "会员体系", desc: "等级/积分/储值", icon: Users, color: "bg-amber-500" },
  { href: "/marketing/ratings", label: "评价管理", desc: "顾客评价/评星统计", icon: Star, color: "bg-yellow-500" },
  { href: "/marketing", label: "互动玩法", desc: "转盘/刮刮乐/签到", icon: Sparkles, color: "bg-green-500" },
  { href: "/marketing", label: "满量折扣", desc: "第N件优惠/买赠", icon: BadgePercent, color: "bg-pink-500" },
];

export default async function MarketingPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  return (
    <div>
      <PageHeader title="营销活动" description="优惠券、促销活动、会员营销" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`${m.color} p-2.5 rounded-lg`}>
                <m.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{m.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
