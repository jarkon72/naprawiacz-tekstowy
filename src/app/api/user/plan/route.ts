import { NextResponse } from "next/server";

export async function GET() {
  const plan = (globalThis as any).USER_PLAN || null;
  return NextResponse.json(plan);
}