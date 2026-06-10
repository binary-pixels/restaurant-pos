"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(data: {
  storeId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      storeId: data.storeId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: data.role,
    },
  });
  revalidatePath("/[locale]/users");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean; password?: string }
) {
  const updateData: any = { ...data };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
  }
  delete updateData.password;

  const user = await prisma.user.update({ where: { id }, data: updateData });
  revalidatePath("/[locale]/users");
  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/[locale]/users");
}

export async function createTag(data: { storeId: string; name: string; color?: string }) {
  const tag = await prisma.tag.create({ data });
  revalidatePath("/[locale]/users");
  return tag;
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/[locale]/users");
}

// Export users as CSV
export async function exportUsersCSV(storeId: string) {
  const users = await prisma.user.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });

  const header = "姓名,邮箱,电话,角色,状态,注册时间\n";
  const rows = users.map((u) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "超级管理员", STORE_ADMIN: "门店管理员",
      CASHIER: "收银员", KITCHEN: "后厨", WAITER: "服务员",
    };
    return [
      u.name, u.email || "", u.phone || "",
      roleMap[u.role] || u.role,
      u.isActive ? "正常" : "已禁用",
      new Date(u.createdAt).toLocaleDateString("zh-CN"),
    ].join(",");
  }).join("\n");

  return header + rows;
}

export async function getTags(storeId: string) {
  return prisma.tag.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}
