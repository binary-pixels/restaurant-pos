import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "https://example.com";
  const size = parseInt(req.nextUrl.searchParams.get("size") || "200");

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    // Convert data URL to buffer
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 });
  }
}
