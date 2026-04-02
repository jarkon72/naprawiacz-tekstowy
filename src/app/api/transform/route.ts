import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { verifyAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ==================== BEZPIECZE?STWO ====================
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),   // 30 zapyta   na minut? na IP
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

export async function POST(req: NextRequest) {
  try {
    // ==================== RATE LIMITING ====================
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "anonymous";

    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Za duzo zapytan. Sprobuj za chwile (max 30/min)." },
        { status: 429 }
      );
    }

    // ==================== RESZTA TWOJEGO KODU ====================
    const body = await req.json();
    const { mode, text, modelOverride } = body;
    const isAdmin = verifyAdmin(req.cookies.get("admin")?.value);

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    const safeText = isAdmin
      ? text
      : text.length > 50000
      ? text.slice(0, 50000)
      : text;

    if (mode === "research" && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let onlineContext = "";
    if (mode === "research" && isAdmin) {
      try {
        const queryPrompt = `Stworz krotkie zapytanie do wyszukiwarki na podstawie tekstu:\n${safeText.slice(0, 2000)}`;
        const qRes = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "qwen2.5:latest", prompt: queryPrompt, stream: false }),
        });
        const qData = await qRes.json();
        const generatedQuery = qData.response?.trim() || safeText.slice(0, 200);

        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: generatedQuery,
            search_depth: "advanced",
            include_answer: true,
          }),
        });
        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          onlineContext = tavilyData.answer || JSON.stringify(tavilyData.results?.slice(0, 3) || []);
        }
      } catch (e) {
        console.log("Tavily error");
      }
    }

    let prompt = "";
    if (mode === "research") {
      prompt = `Masz tekst autora oraz dodatkowe informacje z internetu...\n${onlineContext}\n=== TEKST AUTORA ===\n${safeText}\nZwroc pelny poprawiony tekst.`;
    } else if (mode === "edytuj") prompt = `Popraw bledy:\n\n${safeText}`;
    else if (mode === "skroc") prompt = `Skroc tekst:\n\n${safeText}`;
    else if (mode === "formalny") prompt = `Przerob tekst na formalny:\n\n${safeText}`;
    else if (mode === "translate") prompt = `Przetlumacz na angielski:\n\n${safeText}`;
    else return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });

    let model = getModel(mode, isAdmin ? "admin_premium" : "free");

    if (isAdmin && modelOverride && modelOverride !== "auto") {
      if (modelOverride === "trurl") model = "trurl-13b-q6:latest";
      if (modelOverride === "qwen") model = "qwen2.5:latest";
      if (modelOverride === "qwen14") model = "qwen2.5:14b";
      if (modelOverride === "bielik") model = "bielik-pl-q8:latest";
      if (modelOverride === "openhermes") model = "openhermes-7b-q6:latest";
      if (modelOverride === "mistral") model = "mistral:latest";
      if (modelOverride === "llama") model = "llama3.1:8b";
    }

    let responseText = "";
    if (isAdmin && mode === "research") {
      try {
        const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "trurl-13b-q6:latest",
            prompt,
            stream: false,
            options: { temperature: 0.3, num_ctx: 32768 },
          }),
        });
        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          responseText = data.response?.trim() || "";
        }
      } catch (e) {
        console.log("Ollama offline");
      }
    }

    if (!responseText) responseText = safeText;

    return NextResponse.json({ output: responseText });
  } catch (error) {
    console.error("TRANSFORM ERROR:", error);
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 });
  }
}