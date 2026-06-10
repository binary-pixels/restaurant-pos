"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KitchenDisplay } from "@/components/kitchen/kitchen-display";
import { Loader2, Volume2, VolumeX } from "lucide-react";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 10000);
    return () => clearInterval(timer);
  }, []);

  function speak(text: string) {
    if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 1.1;
    u.volume = 0.8;
    window.speechSynthesis.speak(u);
  }

  function fetchOrders() {
    fetch("/api/kitchen")
      .then((r) => r.json())
      .then((data) => {
        const newOrders = (data.orders || []);
        // Detect new orders
        for (const o of newOrders) {
          if (!knownIds.current.has(o.id)) {
            knownIds.current.add(o.id);
            const table = o.tableLabel || (o.type === "TAKEOUT" ? "自取" : "外卖");
            const count = (o.items || []).length;
            speak("新订单！" + table + "，" + count + "道菜");
          }
        }
        setOrders(newOrders);
      })
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <PageHeader title="后厨看板" description={"实时订单 · " + orders.length + " 单进行中"} />
        <button
          onClick={() => setMuted(!muted)}
          className={"px-4 py-2 text-sm rounded-lg border " + (muted ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200")}
        >
          {muted ? <VolumeX className="w-4 h-4 inline mr-1" /> : <Volume2 className="w-4 h-4 inline mr-1" />}
          {muted ? "已静音" : "语音播报"}
        </button>
      </div>
      <KitchenDisplay orders={orders} />
    </div>
  );
}
