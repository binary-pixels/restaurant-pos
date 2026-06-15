import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.storeConfig.findFirst({ where: { key: "stamp_config" } });
  const cfg = config ? JSON.parse(config.value) : { threshold: 10, reward: 10 };
  return NextResponse.json(cfg);
}
