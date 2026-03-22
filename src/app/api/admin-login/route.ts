// src/app/api/admin-login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ success: false, error: "Brak hasła" }, { status: 400 });
    }

    // Porównanie po stronie serwera – tu hasło jest bezpieczne
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Błędne hasło" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: "Błąd serwera" }, { status: 500 });
  }
}