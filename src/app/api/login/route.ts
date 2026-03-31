import { NextRequest, NextResponse } from "next/server";
import { signAdmin } from "@/lib/adminAuth";

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
  const res = NextResponse.json({ success: true, role: "admin_premium" });

  res.cookies.set("admin", signAdmin("1"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
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