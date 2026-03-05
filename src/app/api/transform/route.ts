import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      output: `Backend odpowiada! Otrzymałem: ${JSON.stringify(body)}`
    });
  } catch (e) {
    return NextResponse.json({ error: "Błąd testowy: " + e.message }, { status: 500 });
  }
}