import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { signToken, setAuthCookie } from "@/src/lib/auth";
import { User } from "@/src/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const unitIds = [
      ...(user.unitIds ?? []).map((unitId: { toString(): string }) => unitId.toString()),
      ...(user.unitId ? [user.unitId.toString()] : []),
    ].filter(
      (unitId: string, index: number, values: string[]) =>
        Boolean(unitId) && values.indexOf(unitId) === index
    );

    const token = signToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      unitId: unitIds[0],
      unitIds,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        unitId: unitIds[0],
        unitIds,
      },
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
