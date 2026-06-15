import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());

  // Parse header
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("name") || header.includes("名称") || header.includes("菜品");

  const results = { success: 0, errors: 0, details: [] as string[] };
  const categories = await prisma.category.findMany({ where: { storeId: session.user.storeId } });

  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 3) { results.errors++; results.details.push("行" + (i + 1) + ": 列数不足"); continue; }

    const [name, categoryName, priceStr, costStr, unitStr, stockStr] = cols;
    const price = parseFloat(priceStr);
    if (!name || isNaN(price)) { results.errors++; results.details.push("行" + (i + 1) + ": 名称或价格无效"); continue; }

    // Find or create category
    let category = categories.find((c) => c.name === categoryName);
    if (!category && categoryName) {
      category = await prisma.category.create({ data: { storeId: session.user.storeId, name: categoryName } });
      categories.push(category);
    }
    if (!category) { results.errors++; results.details.push("行" + (i + 1) + ": 未指定分类"); continue; }

    try {
      await prisma.product.create({
        data: {
          storeId: session.user.storeId,
          categoryId: category.id,
          name,
          price,
          costPrice: parseFloat(costStr) || null,
          unit: unitStr || "份",
          stock: parseInt(stockStr) || 0,
        },
      });
      results.success++;
    } catch {
      results.errors++;
      results.details.push("行" + (i + 1) + ": 创建失败(可能重名)");
    }
  }

  return NextResponse.json(results);
}
