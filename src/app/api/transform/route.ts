import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, text, lang, model } = body;

    if (!text) {
      return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
    }

    let prompt = text;
    if (mode === "edytuj") {
      prompt = `Popraw ten tekst po polsku, zachowaj sens i styl: ${text}`;
    } else if (mode === "skroc") {
      prompt = `Skróć ten tekst do 1/3 długości, zachowaj najważniejsze informacje: ${text}`;
    } else if (mode === "formalny") {
      prompt = `Przerób ten tekst na formalny język polski: ${text}`;
    } else if (mode === "translate") {
      prompt = `Przetłumacz ten tekst na angielski: ${text}`;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192", // darmowy i dobry model
      temperature: 0.7,
      max_tokens: 1024,
    });

    const output = completion.choices[0]?.message?.content || "Brak wyniku";

    return NextResponse.json({ output });
  } catch (error) {
    console.error("Błąd backendu:", error);
    return NextResponse.json({ error: "Błąd przetwarzania: " + (error as Error).message }, { status: 500 });
  }
}