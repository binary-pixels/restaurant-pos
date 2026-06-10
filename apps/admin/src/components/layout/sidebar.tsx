"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Utensils,
  Table,
  DollarSign,
  BarChart3,
  Megaphone,
  Users,
  Settings,
  Box,
} from "lucide-react";

const navItems = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "pos", href: "/pos", icon: ShoppingCart },
  { key: "orders", href: "/orders", icon: ClipboardList },
  { key: "menu", href: "/menu", icon: Utensils },
  { key: "tables", href: "/tables", icon: Table },
  { key: "finance", href: "/finance", icon: DollarSign },
  { key: "reports", href: "/reports", icon: BarChart3 },
  { key: "marketing", href: "/marketing", icon: Megaphone },
  { key: "users", href: "/users", icon: Users },
  { key: "settings", href: "/settings", icon: Settings },
  { key: "ecosystem", href: "/ecosystem", icon: Box },
];

type Props = { collapsed: boolean; onToggle: () => void };

export function AppSidebar({ collapsed }: Props) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");

  const isActive = (href: string) => {
    if (href === "/") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-gray-900 text-white z-30 transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <Utensils className="w-6 h-6 text-blue-400 flex-shrink-0" />
        {!collapsed && (
          <span className="ml-3 font-bold text-lg whitespace-nowrap">
            点餐系统
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="mt-4 px-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={`/${locale}${item.href}`}
            className={cn(
              "flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive(item.href)
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">{t(item.key)}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
