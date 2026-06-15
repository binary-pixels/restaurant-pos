"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const SHIFTS = ["早班 09:00-14:00", "晚班 14:00-22:00", "全天 09:00-22:00", "休息"];

function getWeekDates(offset: number) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return { monday: days[0], days, labels: ["一", "二", "三", "四", "五", "六", "日"] };
}

export default function SchedulesPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: "", date: "", shift: SHIFTS[0] });

  const { monday, days, labels } = getWeekDates(weekOffset);

  useEffect(() => {
    fetch("/api/schedules?weekStart=" + monday)
      .then((r) => r.json())
      .then((d) => { setSchedules(d.schedules || []); setUsers(d.users || []); });
  }, [weekOffset, showForm]);

  async function addShift() {
    if (!form.userId || !form.date) return;
    const user = users.find((u) => u.id === form.userId);
    await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, userName: user?.name || "" }) });
    setShowForm(false);
    setForm({ userId: "", date: days[0], shift: SHIFTS[0] });
  }

  async function remove(id: string) {
    await fetch("/api/schedules?id=" + id, { method: "DELETE" });
    setSchedules(schedules.filter((s) => s.id !== id));
  }

  function getShift(userId: string, date: string) {
    return schedules.find((s) => s.userId === userId && s.date === date);
  }

  return (
    <div>
      <PageHeader title="员工排班" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1 border rounded"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium">{monday} 起</span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1 border rounded"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <button onClick={() => { setForm({ ...form, date: days[0] }); setShowForm(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"><Plus className="w-3.5 h-3.5 inline mr-1" />添加班次</button>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 w-24">员工</th>
              {labels.map((l, i) => <th key={i} className="text-center py-3 px-2 w-24">{l}<br /><span className="text-xs text-gray-400 font-normal">{days[i].slice(5)}</span></th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{u.name}</td>
                {days.map((d) => {
                  const shift = getShift(u.id, d);
                  return (
                    <td key={d} className="py-3 px-2 text-center text-xs">
                      {shift ? (
                        <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded " + (shift.shift === "休息" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-700")}>
                          {shift.shift}
                          <button onClick={() => remove(shift.id)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-5 w-full max-w-sm z-10">
            <h3 className="font-semibold mb-4">添加班次</h3>
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-3">
              <option value="">选择员工</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-3" />
            <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-4">
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={addShift} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
