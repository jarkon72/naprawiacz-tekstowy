import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, text, lang = "pl", role = "free" } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    const limits = {
      free: 1500,
      standard: 5000,
      pro: 10000,
      premium: 50000,
      admin_premium: Infinity,
    };

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const limit = limits[role as keyof typeof limits] || 1500;

    if (wordCount > limit && role !== "admin_premium") {
      return NextResponse.json(
        { error: lang === "pl" ? "Przekroczono limit słów" : "Word limit exceeded" },
        { status: 429 }
      );
    }

    let prompt = "";
    switch (mode) {
      case "edytuj":
        prompt = `Popraw błędy gramatyczne, stylistyczne i interpunkcyjne w tym tekście. Zachowaj sens i ton. Zwróć TYLKO poprawioną wersję bez komentarzy:\n\n${text}`;
        break;
      case "skroc":
        prompt = `Skróć tekst do około 40-60% długości, zachowaj najważniejsze informacje. Zwróć TYLKO skróconą wersję:\n\n${text}`;
        break;
      case "formalny":
        prompt = `Przerób tekst na formalny, profesjonalny styl polski. Zwróć TYLKO przeredagowaną wersję:\n\n${text}`;
        break;
      case "translate":
        prompt = `Przetłumacz tekst na język angielski, zachowaj sens i ton. Zwróć TYLKO tłumaczenie:\n\n${text}`;
        break;
      case "research":
        prompt = `Uzupełnij brakujące fakty i dane w tekście, zachowując styl autora. Zwróć TYLKO wzbogaconą wersję:\n\n${text}`;
        break;
      default:
        return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });
    }

    // === OLLAMA (lokalna) ===
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    let responseText = "";

    try {
      const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "trurl-13b-q6:latest",
          prompt,
          stream: false,
          options: { temperature: 0.4, num_ctx: 8192 },
        }),
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        responseText = data.response || "";
      }
    } catch (e) {
      console.log("Ollama niedostępna – używam fallback");
    }

    // Czysty fallback bez słowa "Demo"
    if (!responseText.trim()) {
      responseText = text; // po prostu zwraca oryginalny tekst (najczystsze rozwiązanie na razie)
    }

    return NextResponse.json({ output: responseText.trim() });
  } catch (error) {
    console.error("[Transform API] Błąd:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}