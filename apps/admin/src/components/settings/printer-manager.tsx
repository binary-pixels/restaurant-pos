"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Printer, Wifi, Usb, Trash2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createDevice, deleteDevice, updateDevice } from "@/actions/device-actions";

type Props = { devices: any[]; storeId: string };

export function PrinterManager({ devices: initDevices, storeId }: Props) {
  const router = useRouter();
  const [devices, setDevices] = useState(initDevices);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "PRINTER_THERMAL", connection: "NETWORK", ip: "", port: 9100,
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    const d = await createDevice({ storeId, ...form });
    setDevices([...devices, d]);
    setShowForm(false);
    setForm({ name: "", type: "PRINTER_THERMAL", connection: "NETWORK", ip: "", port: 9100 });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteDevice(id);
    setDevices(devices.filter((d) => d.id !== id));
    router.refresh();
  }

  async function handleToggle(id: string, isActive: boolean) {
    await updateDevice(id, { isActive });
    setDevices(devices.map((d) => d.id === id ? { ...d, isActive } : d));
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 inline mr-1" /> 新增打印机
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <div key={d.id} className={cn("bg-white rounded-xl border p-5", !d.isActive && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", d.status === "online" ? "bg-green-100" : "bg-gray-100")}>
                  <Printer className={cn("w-5 h-5", d.status === "online" ? "text-green-600" : "text-gray-400")} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{d.name}</h3>
                  <p className="text-xs text-gray-500">{d.type === "PRINTER_KITCHEN" ? "后厨打印机" : "前台打印机"}</p>
                </div>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                d.status === "online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {d.status === "online" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {d.status === "online" ? "在线" : "离线"}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                {d.connection === "NETWORK" ? <Wifi className="w-3.5 h-3.5" /> : <Usb className="w-3.5 h-3.5" />}
                {d.connection === "NETWORK" ? (d.ip || "--") + ":" + (d.port || "--") : "USB 连接"}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t">
              <button onClick={() => handleToggle(d.id, !d.isActive)} className={cn("flex-1 py-2 text-sm border rounded-lg", d.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600")}>
                {d.isActive ? "停用" : "启用"}
              </button>
              <button onClick={() => handleDelete(d.id)} className="p-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {devices.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">暂无打印机</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-4">新增打印机</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：前台打印机" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="PRINTER_THERMAL">前台热敏打印机</option>
                  <option value="PRINTER_KITCHEN">后厨打印机</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">连接方式</label>
                <select value={form.connection} onChange={(e) => setForm({ ...form, connection: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="NETWORK">网络打印 (TCP/IP)</option>
                  <option value="USB">USB 连接</option>
                </select>
              </div>
              {form.connection === "NETWORK" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">IP 地址</label>
                    <input value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.x" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">端口</label>
                    <input value={String(form.port)} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} placeholder="9100" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
