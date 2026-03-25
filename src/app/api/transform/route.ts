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
        prompt = `Uzupełnij brakujące fakty i dane w tekście, zachowując dokładnie styl autora. Dodaj wiarygodne informacje, daty, nazwy własne jeśli potrzeba. Zwróć TYLKO wzbogaconą wersję bez komentarzy:\n\n${text}`;
        break;
      default:
        return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });
    }

    // ==================== OLLAMA DLA ADMINA ====================
    let responseText = "";

    if (role === "admin_premium" && mode === "research") {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

      try {
        const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "trurl-13b-q6:latest",
            prompt,
            stream: false,
            options: { 
              temperature: 0.3,
              num_ctx: 8192 
            },
          }),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          responseText = data.response || "";
        } else {
          console.error("Ollama error:", ollamaRes.status);
        }
      } catch (e) {
        console.log("Ollama niedostępna (normalne na Vercel)");
      }
    }

    // Fallback dla Research (Admin)
    if (role === "admin_premium" && mode === "research" && !responseText.trim()) {
      responseText = `[Ollama niedostępna]\n\nUruchom Ollamę lokalnie na swoim komputerze (ollama serve) i spróbuj ponownie.\n\nOryginalny tekst:\n${text}`;
    }

    // Normalny fallback dla innych trybów i użytkowników
    if (!responseText.trim()) {
      responseText = text;   // zwracamy oryginalny tekst (czysto)
    }

    return NextResponse.json({ output: responseText.trim() });
  } catch (error) {
    console.error("[Transform API] Błąd:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}