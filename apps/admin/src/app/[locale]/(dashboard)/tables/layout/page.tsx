"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const GRID_COLS = 8;
const GRID_ROWS = 6;

export default function TableLayoutPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [activeZone, setActiveZone] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tables-layout")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.zones || []);
        if (d.zones?.length > 0) {
          setActiveZone(d.zones[0].id);
          setTables(d.zones[0].tables || []);
        }
      });
  }, []);

  useEffect(() => {
    if (activeZone) {
      const zone = zones.find((z) => z.id === activeZone);
      if (zone) setTables(zone.tables || []);
    }
  }, [activeZone, zones]);

  function getTableAt(x: number, y: number) {
    return tables.find((t) => t.posX === x && t.posY === y);
  }

  async function dropTable(tableId: string, x: number, y: number) {
    if (getTableAt(x, y)) return;
    await fetch("/api/tables-layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tableId, posX: x, posY: y }),
    });
    setTables(tables.map((t) => t.id === tableId ? { ...t, posX: x, posY: y } : t));
    setDragging(null);
  }

  return (
    <div>
      <PageHeader title="桌台布局" description="拖拽桌台到网格中对应位置" />
      <div className="flex items-center gap-2 mb-4">
        {zones.map((z) => (
          <button key={z.id} onClick={() => setActiveZone(z.id)} className={cn("px-4 py-2 rounded-lg text-sm", activeZone === z.id ? "bg-blue-600 text-white" : "bg-white border")}>{z.name}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
          {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
            const x = i % GRID_COLS;
            const y = Math.floor(i / GRID_COLS);
            const table = getTableAt(x, y);
            return (
              <div
                key={i}
                className="border-2 border-dashed border-gray-200 rounded-lg min-h-[80px] flex items-center justify-center text-xs text-gray-400 relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("tableId");
                  if (id) dropTable(id, x, y);
                }}
              >
                {table ? (
                  <div
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("tableId", table.id); setDragging(table.id); }}
                    className={cn("w-full h-full rounded-lg flex items-center justify-center font-bold text-sm cursor-move", table.status === "AVAILABLE" ? "bg-green-100 text-green-700" : table.status === "OCCUPIED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600")}
                  >
                    {table.label}
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">空</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Unplaced tables sidebar */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 w-full">未放置桌台（拖到网格中）：</span>
        {tables.filter((t) => t.posX == null || t.posY == null).map((t) => (
          <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("tableId", t.id)} className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium cursor-move">{t.label}</div>
        ))}
        {tables.filter((t) => t.posX != null && t.posY != null).length === tables.length && tables.length > 0 && (
          <span className="text-xs text-gray-400">全部已放置</span>
        )}
      </div>
    </div>
  );
}
