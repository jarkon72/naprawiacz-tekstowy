import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password } = body;

  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, role: "admin_premium" });
  } else {
    return NextResponse.json({ success: false, error: "Błędne hasło" }, { status: 401 });
  }
}