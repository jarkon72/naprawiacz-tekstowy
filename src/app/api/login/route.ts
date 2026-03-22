// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
<<<<<<< HEAD
    const body = await req.json();
    const { password } = body;

    // ─── DEBUG (zostaw na razie – potem możesz usunąć) ───────────────
    console.log("=== Otrzymane hasło ===");
    console.log("Wartość:", JSON.stringify(password));
    console.log("Długość:", password?.length ?? "brak");
    console.log("Hasło z .env:", JSON.stringify(process.env.ADMIN_PASSWORD));
    console.log("Długość env:", process.env.ADMIN_PASSWORD?.length ?? "brak");

    // Najprostsze możliwe porównanie – bez trim po stronie serwera
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, role: "admin_premium" });
    }

    // Tymczasowy obejście – jeśli hardkod działa → wiemy, że problem w .env
    if (password === "alamaKOTAaKOTmaALE") {
      console.log("Hardkod zadziałał – sprawdź .env.local !");
      return NextResponse.json({ success: true, role: "admin_premium" });
    }

    return NextResponse.json(
      { success: false, error: "Błędne hasło" },
      { status: 401 }
    );
  } catch (err) {
    console.error("Błąd API:", err);
    return NextResponse.json(
      { success: false, error: "Błąd serwera" },
      { status: 500 }
    );
=======
    const { password } = await req.json();

    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
>>>>>>> 83d29340505198f401c47830019c9e5709c51ba8
  }
}