"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Edit2, Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { createZone, createTable, deleteZone, deleteTable, updateTable } from "@/actions/table-actions";

type ZoneWithTables = {
  id: string;
  name: string;
  sortOrder: number;
  tables: {
    id: string;
    label: string;
    capacity: number;
    status: string;
  }[];
};

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "bg-green-500",
  OCCUPIED: "bg-red-500",
  RESERVED: "bg-blue-500",
  CLEANING: "bg-yellow-500",
  DISABLED: "bg-gray-400",
};

type Props = { zones: ZoneWithTables[]; storeId: string };

export function TableManager({ zones: initialZones, storeId }: Props) {
  const t = useTranslations("tables");
  const c = useTranslations("common");
  const router = useRouter();
  const [zones, setZones] = useState(initialZones);
  const [activeZone, setActiveZone] = useState(zones[0]?.id || "");
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newTable, setNewTable] = useState({ label: "", capacity: 4 });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentZone = zones.find((z) => z.id === activeZone);
  const tables = currentZone?.tables || [];

  async function handleAddZone() {
    if (!newZoneName.trim()) return;
    const zone = await createZone({ storeId, name: newZoneName.trim() });
    setZones([...zones, { ...zone, tables: [] }]);
    setNewZoneName("");
    setShowAddZone(false);
    setActiveZone(zone.id);
    router.refresh();
  }

  async function handleDeleteZone(id: string) {
    await deleteZone(id);
    const updated = zones.filter((z) => z.id !== id);
    setZones(updated);
    if (activeZone === id) setActiveZone(updated[0]?.id || "");
    router.refresh();
  }

  async function handleAddTable() {
    if (!newTable.label.trim() || !activeZone) return;
    const table = await createTable({ zoneId: activeZone, label: newTable.label.trim(), capacity: newTable.capacity });
    setZones(
      zones.map((z) =>
        z.id === activeZone ? { ...z, tables: [...z.tables, table] } : z
      )
    );
    setNewTable({ label: "", capacity: 4 });
    setShowAddTable(false);
    router.refresh();
  }

  async function handleDeleteTable(id: string) {
    await deleteTable(id);
    setZones(
      zones.map((z) => ({
        ...z,
        tables: z.tables.filter((t) => t.id !== id),
      }))
    );
    router.refresh();
  }

  async function handleStatusChange(tableId: string, newStatus: string) {
    await updateTable(tableId, { status: newStatus });
    setZones(
      zones.map((z) => ({
        ...z,
        tables: z.tables.map((t) =>
          t.id === tableId ? { ...t, status: newStatus } : t
        ),
      }))
    );
    router.refresh();
  }

  return (
    <div>
      {/* Zone Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeZone === zone.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              )}
            >
              {zone.name}
              {activeZone === zone.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteZone(zone.id);
                  }}
                  className="ml-2 text-red-400 hover:text-red-300 inline"
                  title={c("delete")}
                >
                  <Trash2 className="w-3 h-3 inline" />
                </button>
              )}
            </button>
          ))}
          <button
            onClick={() => setShowAddZone(true)}
            className="px-3 py-2 rounded-lg text-sm border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            {t("addZone")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-2 rounded-lg", viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100")}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-2 rounded-lg", viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100")}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddTable(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            disabled={!activeZone}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            {t("addTable")}
          </button>
        </div>
      </div>

      {/* Add Zone Dialog */}
      {showAddZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddZone(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">{t("addZone")}</h3>
            <input
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="分区名称"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddZone(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">
                {c("cancel")}
              </button>
              <button onClick={handleAddZone} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {c("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Dialog */}
      {showAddTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddTable(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">{t("addTable")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("label")}</label>
                <input
                  value={newTable.label}
                  onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
                  placeholder="如: A13"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("capacity")}</label>
                <input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={1}
                  max={50}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddTable(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">
                {c("cancel")}
              </button>
              <button onClick={handleAddTable} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {c("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className={cn(
        viewMode === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          : "space-y-2"
      )}>
        {tables.map((table) => (
          <div
            key={table.id}
            className={cn(
              "group relative rounded-xl border-2 transition-all",
              viewMode === "grid"
                ? "p-4 flex flex-col items-center justify-center min-h-[120px]"
                : "p-3 flex items-center justify-between",
              table.status === "AVAILABLE" && "border-green-200 bg-green-50",
              table.status === "OCCUPIED" && "border-red-200 bg-red-50",
              table.status === "RESERVED" && "border-blue-200 bg-blue-50",
              table.status === "CLEANING" && "border-yellow-200 bg-yellow-50",
              table.status === "DISABLED" && "border-gray-200 bg-gray-100"
            )}
          >
            {/* Status dot */}
            <div className={cn(
              "absolute top-2 right-2 w-3 h-3 rounded-full",
              STATUS_COLOR[table.status] || "bg-gray-400"
            )} />

            <div className={cn(viewMode === "grid" ? "text-center" : "flex items-center gap-4")}>
              <p className="text-2xl font-bold text-gray-900">{table.label}</p>
              <p className="text-sm text-gray-500">
                {table.capacity}人 · {t(table.status.toLowerCase() as any)}
              </p>
            </div>

            {/* Actions */}
            <div className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              viewMode === "grid" ? "mt-3" : ""
            )}>
              <div className="flex items-center gap-1">
                <select
                  value={table.status}
                  onChange={(e) => handleStatusChange(table.id, e.target.value)}
                  className="text-xs border rounded px-1 py-0.5"
                >
                  <option value="AVAILABLE">{t("available")}</option>
                  <option value="OCCUPIED">{t("occupied")}</option>
                  <option value="RESERVED">{t("reserved")}</option>
                  <option value="CLEANING">{t("cleaning")}</option>
                  <option value="DISABLED">{t("disabled")}</option>
                </select>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无桌台，点击"添加桌台"开始
          </div>
        )}
      </div>
    </div>
  );
}
