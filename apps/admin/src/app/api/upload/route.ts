import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Validate type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate filename
  const ext = file.name.split(".").pop() || "png";
  const filename = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;

  // Save to public/uploads/products/
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const url = "/uploads/products/" + filename;
  return NextResponse.json({ url });
}
