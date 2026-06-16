"use client";

import { useEffect, useState, useRef } from "react";
import { KitchenDisplay } from "@/components/kitchen/kitchen-display";
import { Loader2, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; gain.gain.value = 0.1;
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 10000);
    return () => clearInterval(timer);
  }, []);

  function speak(text: string) {
    if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN"; u.rate = 1.1; u.volume = 0.8;
    window.speechSynthesis.speak(u);
  }

  function fetchOrders() {
    fetch("/api/kitchen")
      .then((r) => r.json())
      .then((data) => {
        const newOrders = (data.orders || []);
        for (const o of newOrders) {
          if (!knownIds.current.has(o.id)) {
            knownIds.current.add(o.id);
            beep();
            const table = o.tableLabel || (o.type === "TAKEOUT" ? "自取" : "外卖");
            speak("新订单！" + table + "，" + (o.items || []).length + "道菜");
          }
        }
        setOrders(newOrders);
      })
      .finally(() => setLoading(false));
  }

  function toggleFullscreen() {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  const header = (
    <div className="flex items-center justify-between mb-2 no-print">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">后厨看板</h1>
        <p className="text-sm text-gray-500">实时订单 · {orders.length} 单进行中</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setMuted(!muted)} className={"px-3 py-1.5 text-sm rounded-lg border " + (muted ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
          {muted ? <VolumeX className="w-4 h-4 inline mr-1" /> : <Volume2 className="w-4 h-4 inline mr-1" />}
          {muted ? "静音" : "播报"}
        </button>
        <button onClick={toggleFullscreen} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
          {fullscreen ? <Minimize className="w-4 h-4 inline mr-1" /> : <Maximize className="w-4 h-4 inline mr-1" />}
          {fullscreen ? "退出全屏" : "全屏"}
        </button>
      </div>
    </div>
  );

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-gray-50 p-4 overflow-auto" : ""}>
      {header}
      <KitchenDisplay orders={orders} />
    </div>
  );
}
