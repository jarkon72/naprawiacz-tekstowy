"use client";

import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate";

export default function Home() {
  const [lang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"free" | "pro" | "premium" | "admin_premium">("free");
  const [dailyWordsUsed, setDailyWordsUsed] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = (key: string) => {
    const pl = {
      title: "Poprawiacz tekstu",
      input: "Tekst wejściowy",
      output: "Tekst wyjściowy",
      edit: "Edytuj",
      shorten: "Skróć",
      formal: "Sformalizuj",
      translate: "Przetłumacz",
      loading: "Przetwarzam...",
      noText: "Wpisz tekst!",
      copy: "Kopiuj",
      paste: "Wklej",
      chars: "znaków",
      words: "słów",
      dailyLimitReached: "Limit osiągnięty",
    };
    return pl[key as keyof typeof pl];
  };

  const limits = {
    free: 1500,
    pro: 10000,
    premium: 50000,
    admin_premium: Infinity,
  };

  const enterAsAdmin = () => {
    setRole("admin_premium");
    alert("Admin Premium aktywny");
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleAction(mode: Mode) {
    if (!input.trim()) return alert(t("noText"));

    const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
    const limit = limits[role];

    if (dailyWordsUsed + wordCount > limit && role !== "admin_premium") {
      return alert(t("dailyLimitReached"));
    }

    setLoading(true);
    setOutput(t("loading"));

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input }),
      });

      const data = await res.json();
      setOutput(data.output || "Brak wyniku");
      setDailyWordsUsed(prev => prev + wordCount);
    } catch {
      setOutput("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = () => navigator.clipboard.writeText(output);

  const pasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {}
  };

  const stats = (t: string) => ({
    chars: t.length,
    words: t.trim().split(/\s+/).filter(Boolean).length,
  });

  const inputStats = stats(input);
  const outputStats = stats(output);

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">{t("title")}</h1>
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={enterAsAdmin}
          className="px-6 py-2 bg-yellow-600 text-white rounded"
        >
          Wejdź jako Admin (bez hasła)
        </button>
      </div>

      <div className="text-center mt-2 text-yellow-400 font-bold">
        Aktualna rola: {role.toUpperCase()}
      </div>

      {/* 🔥 KLUCZOWA POPRAWKA */}
      <div className="editor-grid flex-1 min-h-0">
        
        {/* OUTPUT */}
        <div className="panel">
          <div className="panel-header">{t("output")}</div>

          <div className="textarea-wrapper">
            <div className="textarea whitespace-pre-wrap">
              {loading ? t("loading") : output || "Tu pojawi się wynik"}
            </div>

            {output && (
              <button onClick={copyOutput} className="copy-btn">
                {t("copy")}
              </button>
            )}
          </div>

          <div className="counter">
            {t("chars")}: {outputStats.chars} | {t("words")}: {outputStats.words}
          </div>
        </div>

        {/* INPUT */}
        <div className="panel">
          <div className="panel-header">{t("input")}</div>

          <div className="textarea-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="textarea"
            />

            <button onClick={pasteInput} className="paste-btn">
              {t("paste")}
            </button>
          </div>

          <div className="counter">
            {t("chars")}: {inputStats.chars} | {t("words")}: {inputStats.words}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="actions">
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj">
          {t("edit")}
        </button>

        <button onClick={() => handleAction("skroc")} className="btn btn-skroc">
          {t("shorten")}
        </button>

        <button onClick={() => handleAction("formalny")} className="btn btn-formalny">
          {t("formal")}
        </button>

        <button onClick={() => handleAction("translate")} className="btn btn-translate">
          {t("translate")}
        </button>
      </div>
    </div>
  );
}