"use client";

import { useTranslations, useLocale } from "next-intl";
import { signOut } from "next-auth/react";
import {
  Menu,
  LogOut,
  Globe,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  storeName?: string;
  collapsed: boolean;
  onToggle: () => void;
};

export function TopBar({ storeName = "好味道餐厅", collapsed, onToggle }: Props) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  const switchLocale = () => {
    const next = locale === "zh-CN" ? "en" : "zh-CN";
    const path = window.location.pathname.replace(`/${locale}`, `/${next}`);
    window.location.href = path;
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-6 transition-all duration-200",
        collapsed ? "left-16" : "left-56"
      )}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{storeName}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={switchLocale}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Globe className="w-4 h-4" />
          {locale === "zh-CN" ? "EN" : "中文"}
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              管
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
