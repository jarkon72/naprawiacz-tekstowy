import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // 🔥 ważne dla process.env

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body?.key;

    const ADMIN_KEY = process.env.ADMIN_KEY;

    if (!ADMIN_KEY) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_KEY missing" },
        { status: 500 }
      );
    }

    if (key !== ADMIN_KEY) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("admin", "1", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}