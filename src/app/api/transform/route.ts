import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { verifyAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

// ==================== BEZPIECZE?STWO ====================
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

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "anonymous";

    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Za du?o zapyta里. Spr車buj za chwil? (max 30/min)." },
        { status: 429 }
      );
    }

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
        const queryPrompt = `Stw車rz kr車tkie zapytanie do wyszukiwarki:\n${safeText.slice(0, 2000)}`;
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
      } catch {
        console.log("Tavily error");
      }
    }

    let prompt = "";

    if (mode === "research") {
      prompt = `Masz tekst autora oraz dane z internetu:\n${onlineContext}\n=== TEKST ===\n${safeText}`;
    } else if (mode === "edytuj") {
      prompt = `Popraw b??dy:\n\n${safeText}`;
    } else if (mode === "skroc") {
      prompt = `Skr車? tekst:\n\n${safeText}`;
    } else if (mode === "formalny") {
      prompt = `Zr車b formaln? wersj?:\n\n${safeText}`;
    } else if (mode === "translate") {
      prompt = `Przet?umacz na angielski:\n\n${safeText}`;
    } else {
      return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });
    }

    let model = getModel(mode, isAdmin ? "admin_premium" : "free");

    let responseText = safeText;

    return NextResponse.json({ output: responseText });

  } catch (error) {
    console.error("TRANSFORM ERROR:", error);
    return NextResponse.json({ error: "B??d serwera" }, { status: 500 });
  }
}