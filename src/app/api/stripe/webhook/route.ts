import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  let used = 0;

  try {
    const raw = fs.readFileSync("data/usage.json", "utf-8");
    const data = raw ? JSON.parse(raw) : {};
    used = data["test-user"] || 0;
  } catch {}

  return NextResponse.json({
    used
  });
}