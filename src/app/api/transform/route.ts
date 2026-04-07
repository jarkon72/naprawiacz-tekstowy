import { NextRequest, NextResponse } from "next/server";
import { getUserId, getUserData, saveUserData } from "@/lib/user";
import { applyReset, LIMITS } from "@/lib/resetUsage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("=== API /transform WYWOŁANE ===");

  try {
    const userId = await getUserId();
    const userData = await getUserData(userId) || {};
    const plan = userData.plan || "standard";

    // Tymczasowo wyłączamy limit na czas testów
    const used = 0;
    const limit = Infinity;

    const body = await req.json();
    const { mode, text, model: selectedModel } = body;

    console.log("Mode:", mode);
    console.log("Wybrany model:", selectedModel);
    console.log("Długość tekstu:", text?.length);

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    const safeText = text.length > 50000 ? text.slice(0, 50000) : text;
    const finalModel = selectedModel || "qwen2.5:latest";

    console.log(`Wysyłam do Ollamy model: ${finalModel}`);

    let output = "";

    try {
      const ollamaRes = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: finalModel,
          prompt: `Jesteś profesjonalnym redaktorem tekstów po polsku.

Zadanie: ${mode === "edytuj" ? "Popraw błędy językowe, interpunkcję, styl i uczyń tekst klarowny oraz płynny." :
         mode === "skroc" ? "Skróć tekst, usuń powtórzenia, zachowując sens." :
         mode === "formalny" ? "Przeredaguj na bardziej formalny język." :
         "Przetwórz tekst według instrukcji."}

Tekst:
${safeText}

Zwróć TYLKO poprawioną wersję tekstu. Bez żadnych komentarzy.`,
          stream: false,
          keep_alive: "20m",
        }),
      });

      console.log("Ollama status:", ollamaRes.status);

      if (!ollamaRes.ok) {
        const errText = await ollamaRes.text();
        console.error("Ollama błąd:", ollamaRes.status, errText);
        throw new Error(`Ollama HTTP ${ollamaRes.status}`);
      }

      const data = await ollamaRes.json();
      output = data.response?.trim() || "Model nie zwrócił odpowiedzi.";

      console.log("Ollama zwróciła odpowiedź, długość:", output.length);

    } catch (ollamaErr: any) {
      console.error("Błąd Ollamy:", ollamaErr.message);
      output = "Błąd połączenia z Ollamą. Sprawdź czy ollama serve jest uruchomione.";
    }

    // Zapisz zużycie
    const newUsed = (userData.used || 0) + safeText.length;
    await saveUserData(userId, { plan, used: newUsed, lastUsed: Date.now() });

    return NextResponse.json({ output });

  } catch (error: any) {
    console.error("=== BŁĄD W ROUTE.TS ===", error);
    return NextResponse.json({ 
      error: "Błąd serwera",
      message: error.message 
    }, { status: 500 });
  }
}