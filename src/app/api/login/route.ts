import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    console.log("=== Otrzymane hasło ===");
    console.log("Wartość:", JSON.stringify(password));
    console.log("Długość:", password?.length ?? "brak");
    console.log("Hasło z .env:", JSON.stringify(process.env.ADMIN_PASSWORD));
    console.log("Długość env:", process.env.ADMIN_PASSWORD?.length ?? "brak");

    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, role: "admin_premium" });
    }

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
  }
}