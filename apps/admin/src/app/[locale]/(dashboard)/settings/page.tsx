"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Save, Store, CreditCard, Bell, Truck, Smartphone, PanelTop } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const configSections = [
  { href: "/settings", label: "门店信息", icon: Store, desc: "名称、地址、电话、营业时间" },
  { href: "/settings/printers", label: "打印机设置", icon: PanelTop, desc: "前台/后厨打印设备" },
  { href: "/settings", label: "通知提醒", icon: Bell, desc: "微信/短信/邮箱通知绑定" },
  { href: "/settings", label: "支付配置", icon: CreditCard, desc: "微信支付/支付宝商户" },
  { href: "/settings", label: "配送设置", icon: Truck, desc: "达达/蜂鸟/闪送聚合配送" },
  { href: "/settings", label: "小程序管理", icon: Smartphone, desc: "头像/名称/版本发布" },
];

export default function SettingsPage() {
  const t = useTranslations("common");
  const [form, setForm] = useState({
    name: "好味道餐厅", address: "北京市朝阳区美食街88号", phone: "010-88886666",
    openTime: "09:00", closeTime: "22:00", description: "十年老店，正宗川菜",
  });
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader title="系统设置" />

      {/* Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {configSections.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2.5 rounded-lg">
                <s.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{s.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Store Info Form */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5" /> 门店基础信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-1">门店名称</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">电话</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">地址</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">营业时间 (开始)</label>
            <input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">营业时间 (结束)</label>
            <input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">门店简介</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? "已保存" : t("save")}
        </button>
      </div>

      {/* System Switches */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">基础开关</h3>
        <div className="space-y-3 max-w-md">
          {[
            { label: "桌位费", desc: "按桌收取固定服务费", checked: false },
            { label: "GPS定位", desc: "获取顾客位置信息", checked: true },
            { label: "首页收藏", desc: "引导用户收藏小程序", checked: true },
            { label: "手机号必填", desc: "下单前强制验证手机号", checked: false },
            { label: "下单提醒", desc: "新订单语音播报", checked: true },
          ].map((s) => (
            <label key={s.label} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
              <input type="checkbox" defaultChecked={s.checked} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
          ))}
        </div>
      </div>

      {/* Marketing Config */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">营销设置</h3>
        <div className="space-y-3 max-w-md">
          <label className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">新客立减</p>
              <p className="text-xs text-gray-500">首次下单自动减 ¥5</p>
            </div>
            <input type="checkbox" defaultChecked={false} onChange={async (e) => {
              await fetch("/api/marketing-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "new_customer_discount", enabled: e.target.checked, amount: 5 }) });
            }} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
          </label>
          <label className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">满量优惠</p>
              <p className="text-xs text-gray-500">满¥100减¥15</p>
            </div>
            <input type="checkbox" defaultChecked={false} onChange={async (e) => {
              await fetch("/api/marketing-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "volume_discount", enabled: e.target.checked, type: "amount", threshold: 100, value: 15 }) });
            }} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
          </label>
          <label className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">满额赠品</p>
              <p className="text-xs text-gray-500">满¥88送赠饮一杯</p>
            </div>
            <input type="checkbox" defaultChecked={false} onChange={async (e) => {
              await fetch("/api/marketing-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "buy_give", enabled: e.target.checked, threshold: 88, productName: "赠饮一杯" }) });
            }} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
          </label>
        </div>
      </div>
    </div>
  );
}
