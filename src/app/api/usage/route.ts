import { NextResponse } from "next/server";
import { getUserId, getUserData } from "@/lib/user";

const LIMITS: Record<string, number> = {
  free: 2000,
  daypass: 20000,
  standard_monthly: 8000,
  standard_yearly: 8000,
  pro_monthly: 20000,
  pro_yearly: 20000,
  premium_monthly: 80000,
  premium_yearly: 80000,
};

export async function GET() {
  try {
    const userId = await getUserId();           // pobiera lub tworzy userId z cookie
    const userData = await getUserData(userId); // odczyt z Redis

    const plan = userData?.plan || "free";
    const used = userData?.used || 0;
    const limit = LIMITS[plan] || LIMITS.free;

    return NextResponse.json({
      plan,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      userId,                    // przydatne do debugu
    });
  } catch (error) {
    console.error("USAGE API ERROR:", error);
    return NextResponse.json({
      plan: "free",
      used: 0,
      limit: 2000,
      remaining: 2000,
    });
  }
}