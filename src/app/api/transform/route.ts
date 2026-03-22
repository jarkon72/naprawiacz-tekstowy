import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, text, model = "trurl-13b-q6:latest" } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    console.log("[Transform] Otrzymano:", { mode, model, textLen: text.length });

    let prompt = "";

    switch (mode) {
      case "edytuj":
        prompt = `Popraw błędy gramatyczne, stylistyczne i interpunkcyjne w tym tekście po polsku. Zachowaj sens i ton. Zwróć TYLKO poprawioną wersję bez komentarzy:\n\n${text}`;
        break;
      case "skroc":
        prompt = `Skróć tekst do około 40-60% długości, zachowaj najważniejsze informacje. Zwróć TYLKO skróconą wersję:\n\n${text}`;
        break;
      case "formalny":
        prompt = `Przerób tekst na formalny, profesjonalny styl polski. Zwróć TYLKO przeredagowaną wersję:\n\n${text}`;
        break;
      case "translate":
        prompt = `Przetłumacz na angielski, zachowaj sens i ton. Zwróć TYLKO tłumaczenie:\n\n${text}`;
        break;
      case "research":
        prompt = `Uzupełnij fakty jeśli potrzeba, ale nie zmieniaj sensu. Zwróć TYLKO wzbogaconą wersję:\n\n${text}`;
        break;
      default:
        return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });
    }

    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

    const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.4 },
      }),
    });

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      console.error("[Transform] Ollama error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await ollamaRes.json();
    const response = data.response || "Brak odpowiedzi";

    console.log("[Transform] Zwrócono:", response.substring(0, 100) + "...");

    return NextResponse.json({ output: response.trim() });
  } catch (error) {
    console.error("[Transform] Błąd:", error);
    return NextResponse.json(
      { error: "Błąd serwera – sprawdź logi" },
      { status: 500 }
    );
  }
}