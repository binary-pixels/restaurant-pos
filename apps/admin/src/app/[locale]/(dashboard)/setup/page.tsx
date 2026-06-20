"use client";

import { useState, useEffect } from "react";
import { Store, Utensils, Table, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "store", title: "门店信息", icon: Store, desc: "设置餐厅基本信息" },
  { key: "categories", title: "菜品分类", icon: Utensils, desc: "快速创建常用分类" },
  { key: "tables", title: "桌台设置", icon: Table, desc: "一键生成桌台" },
  { key: "done", title: "完成", icon: CheckCircle, desc: "开始使用系统" },
];

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [store, setStore] = useState({ name: "", address: "", phone: "" });
  const [categories, setCategories] = useState<string[]>(["热菜", "凉菜", "酒水", "主食", "烧烤"]);
  const [newCat, setNewCat] = useState("");
  const [tableCount, setTableCount] = useState(12);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/setup-check").then(r => r.json()).then(d => {
      if (d.completed) setDone(true);
    });
  }, []);

  async function saveStore() {
    await fetch("/api/store", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(store) });
    setStep(1);
  }

  async function saveCategories() {
    for (const cat of categories) {
      await fetch("/api/setup/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: cat }) });
    }
    setStep(2);
  }

  async function saveTables() {
    await fetch("/api/setup/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: tableCount }) });
    setStep(3);
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">系统已配置完成 🎉</h1>
          <p className="text-gray-500 mt-2">您可以开始使用所有功能了</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex-1 flex items-center">
            <div className={cn("flex items-center gap-2", i <= step ? "text-blue-600" : "text-gray-400")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", i < step ? "bg-blue-600 text-white" : i === step ? "bg-blue-100 text-blue-600" : "bg-gray-100")}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 bg-gray-200"><div className="h-full bg-blue-600" style={{ width: i < step ? "100%" : "0%" }} /></div>}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border p-8">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">📋 门店信息</h2>
            <div className="space-y-4">
              <input value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} placeholder="餐厅名称 *" className="w-full px-4 py-3 border rounded-xl" />
              <input value={store.address} onChange={e => setStore({ ...store, address: e.target.value })} placeholder="地址" className="w-full px-4 py-3 border rounded-xl" />
              <input value={store.phone} onChange={e => setStore({ ...store, phone: e.target.value })} placeholder="电话" className="w-full px-4 py-3 border rounded-xl" />
              <button onClick={saveStore} disabled={!store.name} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300 flex items-center justify-center gap-2">
                下一步 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-6">🍽️ 菜品分类</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(c => (
                <span key={c} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-1">
                  {c}
                  <button onClick={() => setCategories(categories.filter(x => x !== c))} className="text-blue-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="添加分类" className="flex-1 px-4 py-2 border rounded-lg" onKeyDown={e => { if (e.key === "Enter" && newCat) { setCategories([...categories, newCat]); setNewCat(""); } }} />
              <button onClick={() => { if (newCat) { setCategories([...categories, newCat]); setNewCat(""); } }} className="px-4 py-2 bg-gray-100 rounded-lg">添加</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 border rounded-xl flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> 上一步</button>
              <button onClick={saveCategories} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">下一步 <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-6">🪑 桌台设置</h2>
            <div className="text-center mb-6">
              <p className="text-5xl font-bold text-blue-600">{tableCount}</p>
              <p className="text-gray-500">张桌台</p>
              <input type="range" min={1} max={30} value={tableCount} onChange={e => setTableCount(Number(e.target.value))} className="w-full mt-4" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-xl flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> 上一步</button>
              <button onClick={saveTables} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">完成 <CheckCircle className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">🎉 设置完成！</h2>
            <p className="text-gray-500 mb-6">您的餐厅已经配置好了，可以开始使用</p>
            <a href="/tables/qrcodes" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">生成桌台二维码</a>
          </div>
        )}
      </div>
    </div>
  );
}
