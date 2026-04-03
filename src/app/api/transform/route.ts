import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getUserData, saveUserData } from "@/lib/user";

export const runtime = "nodejs";

// Rate Limiting
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
});

function getModel(mode: string, role: string) {
  if (mode === "research" && role !== "admin_premium") return "qwen2.5:latest";
  if (role === "free" || role === "day" || role === "standard") return "qwen2.5:latest";
  if (role === "pro") return "qwen2.5:latest";
  if (role === "premium") {
    if (mode === "edytuj" || mode === "formalny") return "trurl-13b-q6:latest";
    return "qwen2.5:latest";
  }
  if (role === "admin_premium") {
    if (mode === "research") return "qwen2.5:14b";
    if (mode === "edytuj" || mode === "formalny") return "trurl-13b-q6:latest";
    if (mode === "translate") return "llama3.1:8b";
    return "qwen2.5:latest";
  }
  return "qwen2.5:latest";
}

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

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Za dużo zapytań. Spróbuj za chwilę (max 30/min)." }, { status: 429 });
    }

    const body = await req.json();
    const { mode, text, modelOverride, userId: clientUserId, lang } = body;

    const userId = clientUserId || "anonymous";
    const userData = await getUserData(userId);

    const plan = userData?.plan || "free";
    const used = userData?.used || 0;
    const limit = LIMITS[plan] || 2000;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    const safeText = (plan === "admin_premium" || plan === "premium") 
      ? text 
      : text.length > 50000 ? text.slice(0, 50000) : text;

    // Blokada limitu
    if (used >= limit && plan !== "admin_premium") {
      return NextResponse.json({ error: "Limit słów na dziś został przekroczony." }, { status: 429 });
    }

    // ... reszta Twojej logiki bez zmian (research, Tavily, prompt, model itp.)
    let onlineContext = "";
    if (mode === "research" && plan === "admin_premium") {
      // Twój kod z Tavily...
    }

    let prompt = "";
    if (mode === "research") {
      prompt = `Masz tekst autora oraz dodatkowe informacje z internetu...\n${onlineContext}\n=== TEKST AUTORA ===\n${safeText}\nZwróć pełny poprawiony tekst.`;
    } else if (mode === "edytuj") prompt = `Popraw błędy:\n\n${safeText}`;
    else if (mode === "skroc") prompt = `Skróć tekst:\n\n${safeText}`;
    else if (mode === "formalny") prompt = `Przerób tekst na formalny:\n\n${safeText}`;
    else if (mode === "translate") prompt = `Przetłumacz na angielski:\n\n${safeText}`;
    else return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });

    let model = getModel(mode, plan);

    if (plan === "admin_premium" && modelOverride && modelOverride !== "auto") {
      // Twój override modeli...
    }

    let responseText = "";
    // ... Twój kod z Ollama (bez zmian)

    if (!responseText) responseText = safeText;

    // ZAPISANIE UŻYCIA DO REDIS
    const newUsed = used + (responseText.length / 4); // przybliżona liczba słów
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