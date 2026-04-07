import { NextRequest, NextResponse } from "next/server";
import { getUserId, getUserData, saveUserData } from "@/lib/user";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const userData = await getUserData(userId);
  await saveUserData(userId, {
    plan: userData?.plan || "free",
    used: 0,
    lastUsed: null,
  });
  return NextResponse.json({ ok: true });
}