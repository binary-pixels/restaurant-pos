"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories(storeId: string) {
  return prisma.category.findMany({
    where: { storeId },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProducts(storeId: string, categoryId?: string) {
  return prisma.product.findMany({
    where: {
      storeId,
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: { select: { name: true } },
      specs: { include: { options: true } },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
}

export async function createProduct(data: {
  storeId: string;
  categoryId: string;
  name: string;
  price: number;
  costPrice?: number;
  unit?: string;
  description?: string;
  stock?: number;
  lowStockAt?: number;
  image?: string;
  barcode?: string;
  discountPrice?: number;
  discountEnd?: string;
}) {
  const product = await prisma.product.create({
    data: {
      storeId: data.storeId,
      categoryId: data.categoryId,
      name: data.name,
      price: data.price,
      costPrice: data.costPrice || null,
      image: data.image || null,
      unit: data.unit || "份",
      description: data.description || null,
      stock: data.stock || 0,
      lowStockAt: data.lowStockAt || 10,
      barcode: data.barcode || null,
      discountPrice: data.discountPrice || null,
      discountEnd: data.discountEnd ? new Date(data.discountEnd) : null,
    },
  });
  revalidatePath("/[locale]/menu");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    categoryId?: string;
    name?: string;
    price?: number;
    costPrice?: number;
    unit?: string;
    description?: string;
    stock?: number;
    lowStockAt?: number;
    image?: string;
    barcode?: string;
    discountPrice?: number;
    discountEnd?: string;
    isActive?: boolean;
  }
) {
  // Convert empty string to null for DateTime fields
  const cleanData: any = { ...data };
  if (cleanData.discountEnd === "" || cleanData.discountEnd === undefined) {
    cleanData.discountEnd = null;
  }
  const product = await prisma.product.update({ where: { id }, data: cleanData });
  revalidatePath("/[locale]/menu");
  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/[locale]/menu");
}

export async function addSpec(productId: string, data: { name: string; type: string; isRequired: boolean }) {
  const spec = await prisma.spec.create({
    data: { productId, ...data },
  });
  revalidatePath("/[locale]/menu");
  return spec;
}

export async function addSpecOption(specId: string, data: { label: string; priceAdj: number }) {
  const option = await prisma.specOption.create({
    data: { specId, ...data },
  });
  revalidatePath("/[locale]/menu");
  return option;
}

export async function deleteSpec(id: string) {
  await prisma.spec.delete({ where: { id } });
  revalidatePath("/[locale]/menu");
}

export async function deleteSpecOption(id: string) {
  await prisma.specOption.delete({ where: { id } });
  revalidatePath("/[locale]/menu");
}

export async function createCategory(data: { storeId: string; name: string; sortOrder?: number }) {
  const cat = await prisma.category.create({ data });
  revalidatePath("/[locale]/menu");
  return cat;
}

export async function updateCategory(id: string, data: { name?: string; sortOrder?: number; isActive?: boolean }) {
  const cat = await prisma.category.update({ where: { id }, data });
  revalidatePath("/[locale]/menu");
  return cat;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/[locale]/menu");
}
