// app/api/usage/route.ts
import { NextResponse } from "next/server";
import { getUserId, getUserData, saveUserData } from "@/lib/user";
import { applyReset, getResetInfo, LIMITS } from "@/lib/resetUsage";

export async function GET() {
  try {
    const userId = await getUserId();
    const userData = await getUserData(userId);

    const plan = userData?.plan || "free";
    const lastUsed = userData?.lastUsed || null;

    // Apply reset if period has passed
    const { used, shouldSave } = applyReset(plan, userData?.used || 0, lastUsed);

    // Persist zeroed counter so next call doesn't reset again
    if (shouldSave) {
      await saveUserData(userId, { plan, used: 0, lastUsed });
    }

    const limit = LIMITS[plan] ?? 2000;
    const isUnlimited = limit === Infinity;
    const remaining = isUnlimited ? null : Math.max(0, limit - used);
    const percent = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
    const resetInfo = getResetInfo(plan, lastUsed);

    return NextResponse.json({
      plan,
      used,
      limit: isUnlimited ? null : limit,
      remaining,
      percent,
      resetInfo,
      userId,
    });
  } catch (error) {
    console.error("USAGE API ERROR:", error);
    return NextResponse.json({
      plan: "free",
      used: 0,
      limit: 2000,
      remaining: 2000,
      percent: 0,
      resetInfo: "",
    });
  }
}
