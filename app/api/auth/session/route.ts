import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserFromCookie();

  return NextResponse.json({
    user,
    authenticated: Boolean(user),
  });
}
