import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
