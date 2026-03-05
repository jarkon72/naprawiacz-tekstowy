import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      output: `Backend odpowiada! Otrzymałem: ${JSON.stringify(body)}`
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: "Błąd testowy: " + err.message }, { status: 500 });
  }
}