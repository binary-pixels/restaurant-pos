"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Plus, Trash2, Power, PowerOff } from "lucide-react";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }

  async function create() {
    if (!title.trim() || !content.trim()) return;
    await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
    setShowForm(false); setTitle(""); setContent("");
    loadData();
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/announcements", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !active }) });
    loadData();
  }

  async function remove(id: string) {
    await fetch("/api/announcements?id=" + id, { method: "DELETE" });
    loadData();
  }

  return (
    <div>
      <PageHeader title="公告管理" />
      <div className="mb-4">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"><Plus className="w-4 h-4 inline mr-1" />发布公告</button>
      </div>
      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className={"bg-white rounded-xl border p-5 " + (a.isActive ? "" : "opacity-50")}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{a.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleString("zh-CN")}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggle(a.id, a.isActive)} className={"p-1 rounded " + (a.isActive ? "text-green-600" : "text-gray-400")}>{a.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}</button>
                <button onClick={() => remove(a.id)} className="p-1 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {!loading && announcements.length === 0 && <div className="text-center py-12 text-gray-400">暂无公告</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-4">发布公告</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" className="w-full px-3 py-2 border rounded-lg mb-3" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="内容" rows={3} className="w-full px-3 py-2 border rounded-lg mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={create} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
