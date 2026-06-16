"use client";

import { useTranslations, useLocale } from "next-intl";
import { signOut } from "next-auth/react";
import {
  Menu,
  LogOut,
  Globe,
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  storeName?: string;
  collapsed: boolean;
  onToggle: () => void;
};

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("pos-dark-mode") === "1";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("pos-dark-mode", next ? "1" : "0");
    document.documentElement.classList.toggle("dark", next);
  }
  return { dark, toggle };
}

export function TopBar({ storeName = "好味道餐厅", collapsed, onToggle }: Props) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const { dark, toggle: toggleDark } = useDarkMode();
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<any>(null);

  function doSearch(q: string) {
    setSearchQ(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); setShowResults(false); return; }
    timerRef.current = setTimeout(async () => {
      const res = await fetch("/api/search?q=" + encodeURIComponent(q));
      const data = await res.json();
      setResults(data.results || []);
      setShowResults(true);
    }, 300);
  }

  useEffect(() => {
    const poll = () => fetch("/api/notifications").then(r => r.json()).then(d => setNotifCount(d.unreadCount || 0));
    poll();
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, []);

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
        <div className="relative ml-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQ}
            onChange={(e) => doSearch(e.target.value)}
            placeholder="搜索订单/客户/菜品..."
            className="w-64 pl-10 pr-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <a key={i} href={"/" + locale + r.url} className="block px-4 py-2 text-sm hover:bg-gray-50 border-b last:border-0">
                  <span className={r.type === "order" ? "text-blue-600" : r.type === "customer" ? "text-green-600" : "text-purple-600"}>
                    [{r.type === "order" ? "订" : r.type === "customer" ? "客" : "菜"}]
                  </span>{" "}
                  {r.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={switchLocale}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Globe className="w-4 h-4" />
          {locale === "zh-CN" ? "EN" : "中文"}
        </button>

        <button onClick={toggleDark} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" title={dark ? "亮色模式" : "暗色模式"}>
          {dark ? "☀️" : "🌙"}
        </button>

        <button
          className="p-2 hover:bg-gray-100 rounded-lg relative"
          onClick={() => { fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(() => setNotifCount(0)); alert("通知已全部标为已读"); }}
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{notifCount > 9 ? "9+" : notifCount}</span>}
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
