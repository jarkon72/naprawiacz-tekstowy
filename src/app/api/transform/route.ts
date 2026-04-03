import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getUserId, getUserData, saveUserData } from "@/lib/user";
import { applyReset, LIMITS } from "@/lib/resetUsage";

export const runtime = "nodejs";
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
});

function getModel(mode: string, plan: string, selectedModel?: string) {
  // If user explicitly selected a model, use it
  if (selectedModel && selectedModel !== "auto") return selectedModel;

  if (mode === "research" && plan !== "admin_premium") return "qwen2.5:latest";
  if (plan === "free" || plan === "day" || plan === "standard") return "qwen2.5:latest";
  if (plan === "pro") return "qwen2.5:latest";
  if (plan === "premium") {
    if (mode === "edytuj" || mode === "formalny") return "trurl-13b-q6:latest";
    return "qwen2.5:latest";
  }
  if (plan === "admin_premium") {
    if (mode === "research") return "qwen2.5:14b";
    if (mode === "edytuj" || mode === "formalny") return "trurl-13b-q6:latest";
    if (mode === "translate") return "llama3.1:8b";
    return "qwen2.5:latest";
  }
  return "qwen2.5:latest";
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Za dużo zapytań. Spróbuj za chwilę (max 30/min)." },
        { status: 429 }
      );
    }

    // ✅ userId zawsze z cookie — nigdy z body
    const userId = await getUserId();
    const userData = await getUserData(userId);

    const plan = userData?.plan || "free";
    const lastUsed = userData?.lastUsed || null;

    // Apply period reset (daily / monthly / yearly)
    const { used, shouldSave } = applyReset(plan, userData?.used || 0, lastUsed);
    if (shouldSave) {
      await saveUserData(userId, { plan, used: 0, lastUsed });
    }

    const limit = LIMITS[plan] ?? 2000;

    const body = await req.json();
    const { mode, text, model: selectedModel } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    const safeText = text.length > 50000 ? text.slice(0, 50000) : text;

    // ✅ Blokada po przekroczeniu limitu
    if (plan !== "admin_premium" && used >= limit) {
      return NextResponse.json(
        {
          error: "LIMIT_EXCEEDED",
          message: "Limit znaków został wyczerpany.",
          used,
          limit,
        },
        { status: 429 }
      );
    }

    // ✅ Blokada gdy tekst przekroczyłby limit
    if (plan !== "admin_premium" && used + safeText.length > limit) {
      return NextResponse.json(
        {
          error: "LIMIT_EXCEEDED",
          message: `Tekst jest za długi. Pozostało ${limit - used} znaków.`,
          used,
          limit,
          remaining: limit - used,
        },
        { status: 429 }
      );
    }

    const model = getModel(mode, plan, selectedModel);

    // ===== GENEROWANIE =====
    // TODO: wywołanie Ollama/LLM tutaj
    let responseText = safeText; // placeholder

    const newUsed = used + safeText.length;
    await saveUserData(userId, {
      plan,
      used: newUsed,
      lastUsed: Date.now(),
    });

    return NextResponse.json({ output: responseText });

  } catch (error) {
    console.error("TRANSFORM ERROR:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
