import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, text, lang = "pl", role = "free" } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    let prompt = "";
    if (mode === "research") {
      prompt = `Uzupełnij brakujące fakty i dane w tekście. Zachowaj dokładnie styl autora, ton i sposób pisania. Dodaj konkretne informacje, daty, nazwy własne, kontekst historyczny jeśli pasuje. Zwróć TYLKO wzbogaconą wersję tekstu, bez żadnych komentarzy, oznaczeń ani słów "Demo":\n\n${text}`;
    } else if (mode === "edytuj") {
      prompt = `Popraw błędy gramatyczne, stylistyczne i interpunkcyjne. Zachowaj sens i ton oryginalnego tekstu. Zwróć TYLKO poprawioną wersję:\n\n${text}`;
    } else if (mode === "skroc") {
      prompt = `Skróć tekst zachowując najważniejsze informacje. Zwróć TYLKO skróconą wersję:\n\n${text}`;
    } else if (mode === "formalny") {
      prompt = `Przerób tekst na formalny, profesjonalny styl polski. Zwróć TYLKO przeredagowaną wersję:\n\n${text}`;
    } else if (mode === "translate") {
      prompt = `Przetłumacz tekst na język angielski, zachowaj sens i ton. Zwróć TYLKO tłumaczenie:\n\n${text}`;
    } else {
      return NextResponse.json({ error: "Nieznany tryb" }, { status: 400 });
    }

    let responseText = "";

    // Research tylko dla Admina - używamy lokalnej Ollamy
    if (role === "admin_premium" && mode === "research") {
      try {
        const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "trurl-13b-q6:latest",
            prompt,
            stream: false,
            options: { temperature: 0.3, num_ctx: 8192 },
          }),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          responseText = data.response?.trim() || "";
        }
      } catch (e) {
        console.log("Nie udało się połączyć z lokalną Ollamą");
      }
    }

    // Jeśli Ollama nie odpowiedziała przy Research dla Admina
    if (role === "admin_premium" && mode === "research" && !responseText) {
      responseText = `[Ollama działa, ale nie odpowiedziała]\n\nSpróbuj ponownie za chwilę.\n\nOryginalny tekst:\n${text}`;
    }

    // Domyślny fallback dla wszystkich innych przypadków
    if (!responseText) {
      responseText = text;
    }

    return NextResponse.json({ output: responseText });
  } catch (error) {
    console.error("[Transform API] Błąd:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}