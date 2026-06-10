"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Truck, MapPin, Gauge, Power, ExternalLink, CheckCircle, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const DELIVERY_PARTNERS = [
  { id: "dada", name: "达达配送", logo: "🛵", status: "connected", coverage: "全城", avgTime: "30min" },
  { id: "fengniao", name: "蜂鸟即配", logo: "🦅", status: "connected", coverage: "3km内", avgTime: "25min" },
  { id: "shunfeng", name: "顺丰同城", logo: "📦", status: "available", coverage: "全城", avgTime: "45min" },
  { id: "shansong", name: "闪送", logo: "⚡", status: "available", coverage: "全城", avgTime: "20min" },
  { id: "meituan", name: "美团配送", logo: "🛵", status: "available", coverage: "5km内", avgTime: "30min" },
];

export default function DeliveryPage() {
  const [partners] = useState(DELIVERY_PARTNERS);
  const [config, setConfig] = useState({
    autoDispatch: true,
    deliveryFee: 5,
    freeDeliveryMin: 50,
    maxDistance: 5,
    storeLat: "39.9042",
    storeLng: "116.4074",
  });

  return (
    <div>
      <PageHeader title="配送设置" description="第三方配送和费率配置" />

      {/* Delivery Partners */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="px-6 py-4 border-b font-semibold flex items-center gap-2">
          <Truck className="w-5 h-5" /> 聚合配送平台
        </div>
        <div className="divide-y">
          {partners.map((p) => (
            <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">覆盖 {p.coverage} · 约 {p.avgTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {p.status === "connected" ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> 已接入</span>
                ) : (
                  <button className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1">
                    <Power className="w-3 h-3" /> 启用
                  </button>
                )}
                <button className="text-gray-400 hover:text-blue-600"><ExternalLink className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store Location */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" /> 门店坐标
        </h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">纬度 (Lat)</label>
            <input value={config.storeLat} onChange={(e) => setConfig({ ...config, storeLat: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">经度 (Lng)</label>
            <input value={config.storeLng} onChange={(e) => setConfig({ ...config, storeLng: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="mt-4 w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">地图预览区域</p>
            <p className="text-xs">({config.storeLat}, {config.storeLng})</p>
          </div>
        </div>
      </div>

      {/* Fee Config */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5" /> 配送规则
        </h3>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">基础配送费 (元)</label>
            <input type="number" value={config.deliveryFee} onChange={(e) => setConfig({ ...config, deliveryFee: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">免配送费门槛 (元)</label>
            <input type="number" value={config.freeDeliveryMin} onChange={(e) => setConfig({ ...config, freeDeliveryMin: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">最大配送距离 (km)</label>
            <input type="number" value={config.maxDistance} onChange={(e) => setConfig({ ...config, maxDistance: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.autoDispatch} onChange={(e) => setConfig({ ...config, autoDispatch: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-medium">自动派单</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">订单支付后自动向配送平台发单</p>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/delivery-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
            alert("配送配置已保存");
          }}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          保存配置
        </button>
      </div>
    </div>
  );
}
