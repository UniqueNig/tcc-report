import { NextResponse } from "next/server";
import { ensureDemoAccounts } from "@/src/lib/devBootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "Demo account bootstrap is disabled in production." },
      { status: 403 }
    );
  }

  try {
    const result = await ensureDemoAccounts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[BOOTSTRAP ERROR]", error);
    return NextResponse.json(
      { message: "Could not create demo accounts." },
      { status: 500 }
    );
  }
}
