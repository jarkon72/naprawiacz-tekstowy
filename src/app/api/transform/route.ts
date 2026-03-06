import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      output: "TEST OK - backend działa! Otrzymałem tryb: " + (body.mode || "brak")
    });
  } catch (e) {
    return NextResponse.json({ 
      error: "Błąd testowy: " + (e as Error).message 
    }, { status: 500 });
  }
}