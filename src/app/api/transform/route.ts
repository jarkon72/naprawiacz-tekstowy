import { NextRequest, NextResponse } from "next/server";
import { getUserId, getUserData, saveUserData } from "@/lib/user";
import { applyReset, LIMITS } from "@/lib/resetUsage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const userData = await getUserData(userId) || {};
    const plan = userData.plan || "standard";

    // === TYMCZASOWO WYŁĄCZAMY LIMIT DLA TESTÓW ===
    const used = 0;                    // ignorujemy zużycie
    const limit = Infinity;            // brak limitu

    const body = await req.json();
    const { mode, text, model: selectedModel } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    const safeText = text.length > 50000 ? text.slice(0, 50000) : text;

    const finalModel = selectedModel || "qwen2.5:latest";

    let output = "";

    try {
      const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
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

Zwróć TYLKO poprawioną wersję tekstu, bez żadnych komentarzy.`,
          stream: false,
          keep_alive: "10m",
        }),
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama error ${ollamaRes.status}`);
      }

      const data = await ollamaRes.json();
      output = data.response?.trim() || "Brak odpowiedzi od modelu.";

    } catch (err: any) {
      console.error("Ollama error:", err);
      output = "Błąd połączenia z Ollamą. Upewnij się, że Ollama jest uruchomiona (ollama serve).";
    }

    // Zapisz zużycie (nawet jeśli limit wyłączony)
    const newUsed = (userData.used || 0) + safeText.length;
    await saveUserData(userId, { plan, used: newUsed, lastUsed: Date.now() });

    return NextResponse.json({ output });

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}