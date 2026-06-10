"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Download, Upload, Edit2, Tag, X, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { USER_ROLE_MAP } from "@pos/shared";
import { createUser, updateUser, deleteUser, createTag, deleteTag, exportUsersCSV } from "@/actions/user-actions";

type User = { id: string; name: string; email: string | null; phone: string | null; role: string; isActive: boolean; createdAt: Date };
type TagObj = { id: string; name: string; color: string };

type Props = { users: User[]; tags: TagObj[]; storeId: string };

const ROLE_OPTIONS = [
  { value: "STORE_ADMIN", label: "门店管理员" },
  { value: "CASHIER", label: "收银员" },
  { value: "KITCHEN", label: "后厨" },
  { value: "WAITER", label: "服务员" },
];

export function UserManager({ users: initUsers, tags: initTags, storeId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState(initUsers);
  const [tags, setTags] = useState(initTags);
  const [search, setSearch] = useState("");

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "", email: "", phone: "", password: "", role: "CASHIER", isActive: true,
  });

  // Tag form
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#6366f1");

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || (u.email?.toLowerCase().includes(q)) || (u.phone?.includes(q));
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === "STORE_ADMIN" || u.role === "SUPER_ADMIN").length,
    cashiers: users.filter((u) => u.role === "CASHIER").length,
  };

  // === User CRUD ===
  function openCreateUser() {
    setEditingUser(null);
    setUserForm({ name: "", email: "", phone: "", password: "", role: "CASHIER", isActive: true });
    setShowUserForm(true);
  }

  function openEditUser(u: User) {
    setEditingUser(u);
    setUserForm({
      name: u.name, email: u.email || "", phone: u.phone || "",
      password: "", role: u.role, isActive: u.isActive,
    });
    setShowUserForm(true);
  }

  async function handleSaveUser() {
    if (editingUser) {
      const data: any = { name: userForm.name, email: userForm.email, phone: userForm.phone || undefined, role: userForm.role, isActive: userForm.isActive };
      if (userForm.password) data.password = userForm.password;
      await updateUser(editingUser.id, data);
    } else {
      await createUser({ storeId, ...userForm, phone: userForm.phone || undefined });
    }
    setShowUserForm(false);
    router.refresh();
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("确认删除此用户？")) return;
    await deleteUser(id);
    setUsers(users.filter((u) => u.id !== id));
    router.refresh();
  }

  // === Tags ===
  async function handleCreateTag() {
    if (!tagName.trim()) return;
    await createTag({ storeId, name: tagName.trim(), color: tagColor });
    setTagName("");
    setShowTagForm(false);
    router.refresh();
  }

  async function handleDeleteTag(id: string) {
    await deleteTag(id);
    setTags(tags.filter((t) => t.id !== id));
    router.refresh();
  }

  // === Export ===
  async function handleExport() {
    const csv = await exportUsersCSV(storeId);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // === Import ===
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1).filter(Boolean); // skip header
      let count = 0;
      for (const line of lines) {
        const [name, email, phone, roleLabel, ,] = line.split(",");
        if (!name || !email) continue;
        const roleMap: Record<string, string> = { "超级管理员": "SUPER_ADMIN", "门店管理员": "STORE_ADMIN", "收银员": "CASHIER", "后厨": "KITCHEN", "服务员": "WAITER" };
        const role = roleMap[roleLabel?.trim() || ""] || "CASHIER";
        try {
          await createUser({ storeId, name: name.trim(), email: email.trim(), phone: phone?.trim(), password: "123456", role });
          count++;
        } catch { /* skip duplicates */ }
      }
      alert(`导入完成: ${count} 个用户`);
      router.refresh();
    };
    reader.readAsText(file);
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "总用户", value: stats.total, color: "bg-blue-500" },
          { label: "活跃", value: stats.active, color: "bg-green-500" },
          { label: "管理员", value: stats.admins, color: "bg-purple-500" },
          { label: "收银员", value: stats.cashiers, color: "bg-orange-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tags Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-500 mr-1">标签:</span>
        {tags.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>
            {tag.name}
            <button onClick={() => handleDeleteTag(tag.id)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
          </span>
        ))}
        <button onClick={() => setShowTagForm(true)} className="px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600">
          <Plus className="w-3 h-3 inline mr-0.5" />添加
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索用户..." className="w-64 px-3 py-2 border rounded-lg text-sm" />
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
            <Upload className="w-4 h-4" /> 导入CSV
          </button>
          <button onClick={handleExport} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
            <Download className="w-4 h-4" /> 导出CSV
          </button>
          <button onClick={openCreateUser} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
            <UserPlus className="w-4 h-4" /> 添加用户
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">用户</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">角色</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">电话</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">注册时间</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                    user.role === "STORE_ADMIN" && "bg-purple-100 text-purple-700",
                    user.role === "CASHIER" && "bg-blue-100 text-blue-700",
                    user.role === "KITCHEN" && "bg-orange-100 text-orange-700",
                    user.role === "WAITER" && "bg-green-100 text-green-700",
                  )}>
                    {USER_ROLE_MAP[user.role as keyof typeof USER_ROLE_MAP]?.label || user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">{user.phone || "--"}</td>
                <td className="py-3 px-4">
                  <span className={cn("inline-flex items-center gap-1 text-xs", user.isActive ? "text-green-600" : "text-gray-400")}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-green-500" : "bg-gray-300")} />
                    {user.isActive ? "正常" : "已禁用"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditUser(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUserForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editingUser ? "编辑用户" : "添加用户"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">姓名 *</label>
                <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱 *</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">电话</label>
                <input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">角色</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">密码{editingUser ? " (留空不修改)" : " *"}</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder={editingUser ? "留空则不修改密码" : ""} />
              </div>
              {editingUser && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={userForm.isActive} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">账号启用</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowUserForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleSaveUser} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Form Modal */}
      {showTagForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTagForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">添加标签</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">标签名称</label>
                <input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="如：黄金会员" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">颜色</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={tagColor} onChange={(e) => setTagColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                  {["#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899"].map((c) => (
                    <button key={c} onClick={() => setTagColor(c)} className={cn("w-7 h-7 rounded-full border-2", tagColor === c ? "border-gray-800" : "border-transparent")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowTagForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleCreateTag} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
