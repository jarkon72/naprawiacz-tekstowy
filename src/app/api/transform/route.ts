import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({ output: "TEST OK – backend odpowiada!" });
  } catch (e) {
    return NextResponse.json({ error: "Błąd testowy: " + e.message }, { status: 500 });
  }
}