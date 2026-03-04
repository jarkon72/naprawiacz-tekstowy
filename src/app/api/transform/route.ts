import { NextRequest, NextResponse } from "next/server";
import { getPrompt } from "./prompts/prompt";

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, text, lang = "pl", model, role: clientRole } = body;

    // Walidacja podstawowych danych
    if (!text?.trim()) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    // Prosta autoryzacja roli (można rozbudować)
    if (mode === "translate" && clientRole !== "premium" && clientRole !== "admin_premium") {
      return NextResponse.json(
        { error: "Dostęp do tłumaczenia tylko dla Premium / Admin" },
        { status: 403 }
      );
    }

    // Wybór modelu z fallbackiem
    const selectedModel = model || (lang === "pl"
      ? "speakleash/bielik-11b-v3.0-instruct:q5_k_m"
      : "qwen2.5:7b-instruct");

    console.log(`[Ollama] Używam modelu: ${selectedModel}, tryb: ${mode}, długość tekstu: ${text.length}, rola: ${clientRole || "brak"}`);

    const prompt = getPrompt(mode, text);

    // Timeout 10 minut
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.4,
          top_p: 0.9,
          top_k: 40,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Ollama error:", errorText);

      if (res.status === 404) {
        return NextResponse.json({
          error: `Model '${selectedModel}' nie istnieje w Ollamie – sprawdź 'ollama list' i pobierz go.`
        }, { status: 404 });
      }

      return NextResponse.json({
        error: `Błąd Ollamy: ${res.status} – sprawdź, czy serwer działa`
      }, { status: res.status });
    }

    const data = await res.json();
    let corrected = (data.response || "").trim();

    // Czyszczenie typowych wstępów modelu
    corrected = corrected
      .replace(/^(Oto|Poprawiona wersja|Wynik|Przetłumaczona wersja|Odpowiedź).*?[:\-–—\n]/gi, "")
      .trim();

    return NextResponse.json({ output: corrected || "Brak wyniku" });
  } catch (err: any) {
    console.error("Backend error:", err.message, err.stack);

    if (err.name === "AbortError") {
      return NextResponse.json({
        error: "Przetwarzanie trwało zbyt długo (timeout 10 min) – tekst jest bardzo długi. Skróć go lub użyj mniejszego modelu."
      }, { status: 504 });
    }

    return NextResponse.json({
      error: err.message || "Błąd serwera – sprawdź Ollamę i logi"
    }, { status: 500 });
  }
}