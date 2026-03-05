import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { mode, text, lang, model } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "Brak tekstu" }, { status: 400 });
  }

  let prompt = "";
  switch (mode) {
    case "edytuj":
      prompt = `Popraw ten tekst po polsku, zachowaj sens i styl: ${text}`;
      break;
    case "skroc":
      prompt = `Skróć ten tekst do 1/3 długości, zachowaj najważniejsze informacje: ${text}`;
      break;
    case "formalny":
      prompt = `Przerób ten tekst na formalny język polski: ${text}`;
      break;
    case "translate":
      prompt = `Przetłumacz ten tekst na angielski: ${text}`;
      break;
    default:
      prompt = `Przetwórz ten tekst: ${text}`;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    });

    const output = completion.choices[0]?.message?.content || "Brak wyniku";

    return NextResponse.json({ output });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Błąd przetwarzania: " + (error as Error).message }, { status: 500 });
  }
}