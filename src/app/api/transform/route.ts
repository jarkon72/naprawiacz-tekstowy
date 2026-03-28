import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, text } = body;

    const isAdmin = req.cookies.get("admin")?.value === "1";

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    // 🔥 FIX — ograniczenie dużego tekstu
    const safeText = text.length > 20000 ? text.slice(0, 20000) : text;

    // 🔥 INTERNET CONTEXT (TAVILY)
    let onlineContext = "";

    if (mode === "research") {
      try {
        // 🔥 AUTO QUERY (LLM robi zapytanie)
        const queryPrompt = `Stwórz krótkie zapytanie do wyszukiwarki na podstawie tekstu:\n${safeText.slice(0, 2000)}`;

        const qRes = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "qwen2.5:latest",
            prompt: queryPrompt,
            stream: false
          }),
        });

        const qData = await qRes.json();
        const generatedQuery = qData.response?.trim() || safeText.slice(0, 200);

        // 🔥 TAVILY SEARCH
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: generatedQuery,
            search_depth: "advanced",
            include_answer: true,
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          onlineContext =
            tavilyData.answer ||
            JSON.stringify(tavilyData.results?.slice(0, 3) || []);
        }

      } catch (e) {
        console.log("Tavily error");
      }
    }

    let prompt = "";

    if (mode === "research") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      prompt = `
Masz tekst autora oraz dodatkowe informacje z internetu.

Twoim zadaniem jest uzupełnić tekst autora o fakty,
ale NIE skracaj go i NIE zmieniaj sensu.

=== DODATKOWE FAKTY Z INTERNETU ===
${onlineContext}

=== TEKST AUTORA ===
${safeText}

Zwróć pełny poprawiony tekst.
`;

    } else if (mode === "edytuj") {
      prompt = `Popraw błędy:\n\n${safeText}`;

    } else if (mode === "skroc") {
      prompt = `Skróć tekst:\n\n${safeText}`;

    } else if (mode === "formalny") {
      prompt = `Przerób tekst na formalny:\n\n${safeText}`;

    } else if (mode === "translate") {
      prompt = `Przetłumacz na angielski:\n\n${safeText}`;

    } else {
      return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });
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

    if (!responseText) {
      responseText = safeText;
    }

    return NextResponse.json({ output: responseText });

  } catch (error) {
    console.error("TRANSFORM ERROR:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}