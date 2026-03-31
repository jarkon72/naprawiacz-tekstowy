import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 🔥 licznik prób
let attempts = 0;

export async function POST(req: NextRequest) {
  try {
    // 🔥 zwiększamy licznik
    attempts++;

    // 🔥 blokada po 5 próbach
    if (attempts > 5) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts" },
        { status: 429 }
      );
    }

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

    // 🔥 reset po poprawnym haśle
    attempts = 0;

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