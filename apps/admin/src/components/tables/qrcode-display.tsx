"use client";

import { useState } from "react";
import { QrCode, Download, Printer } from "lucide-react";

type Props = {
  zones: any[];
  baseUrl: string;
  storeId: string;
};

export function QrCodeDisplay({ zones, baseUrl, storeId }: Props) {
  const [selectedZone, setSelectedZone] = useState(zones[0]?.id || "");
  const [size, setSize] = useState(180);
  const [style, setStyle] = useState(1);

  const currentZone = zones.find((z) => z.id === selectedZone);
  const allTables = zones.flatMap((z) => z.tables);

  function getQrUrl(table: any) {
    const miniUrl = "/pages/index/index?tableId=" + table.id + "&table=" + encodeURIComponent(table.label || "") + "&storeId=" + storeId;
    return "/api/qrcode?url=" + encodeURIComponent(baseUrl + miniUrl) + "&size=" + size;
  }

  function downloadAll() {
    alert("打印此页面即可获取所有桌码。建议使用标签打印机，纸张尺寸 " + (size / 10) + "mm × " + (size / 10) + "mm。");
    window.print();
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl border p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm text-gray-500 mr-2">分区</label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">全部桌台</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 mr-2">尺寸</label>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
              <option value={120}>小 (12mm)</option>
              <option value={180}>中 (18mm)</option>
              <option value={240}>大 (24mm)</option>
              <option value={300}>特大 (30mm)</option>
            </select>
          </div>
        </div>
        <button onClick={downloadAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
          <Printer className="w-4 h-4" /> 打印全部
        </button>
      </div>

      {/* QR Code Grid */}
      <div className="flex flex-wrap gap-4">
        {(selectedZone ? (currentZone?.tables || []) : allTables).map((table: any) => (
          <div key={table.id} className="bg-white rounded-xl border p-4 text-center" style={{ width: size + 40 }}>
            <img
              src={getQrUrl(table)}
              alt={"桌码 " + table.label}
              width={size}
              height={size}
              className="mx-auto"
            />
            <p className="mt-2 font-bold text-gray-900">{table.label}</p>
            <p className="text-xs text-gray-400">扫码点餐</p>
          </div>
        ))}
      </div>

      {allTables.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无桌台，请先添加桌台</div>
      )}
    </div>
  );
}
