"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate" | "research";

export default function Home() {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"free" | "standard" | "pro" | "premium" | "admin_premium">("free");
  const [dailyWordsUsed, setDailyWordsUsed] = useState(0);
  const [copied, setCopied] = useState(false);
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
      research: "Research (uzupełnij fakty)",
      loading: "Przetwarzam...",
      noText: "Wpisz tekst!",
      copy: "Kopiuj",
      copied: "Skopiowano!",
      paste: "Wklej",
      chars: "znaków",
      words: "słów",
      dailyLimitReached: "Limit dzienny osiągnięty",
      standard: "Standard",
      adminBtn: "Wejdź jako Admin (bez hasła)",
    };
    const en = {
      title: "Text Corrector",
      input: "Input text",
      output: "Output text",
      edit: "Edit",
      shorten: "Shorten",
      formal: "Formalize",
      translate: "Translate",
      research: "Research (add facts)",
      loading: "Processing...",
      noText: "Enter text!",
      copy: "Copy",
      copied: "Copied!",
      paste: "Paste",
      chars: "chars",
      words: "words",
      dailyLimitReached: "Daily limit reached",
      standard: "Standard",
      adminBtn: "Enter as Admin",
    };
    return lang === "pl" ? pl[key as keyof typeof pl] : en[key as keyof typeof en];
  };

  const limits = {
    free: 1500,
    standard: 5000,
    pro: 10000,
    premium: 50000,
    admin_premium: Infinity,
  };

  const enterAsAdmin = () => {
    setRole("admin_premium");
    alert(lang === "pl" ? "Admin Premium aktywny" : "Admin Premium activated");
  };

  const setStandardRole = () => {
    setRole("standard");
    alert(lang === "pl" ? "Konto Standard aktywne" : "Standard account activated");
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
        body: JSON.stringify({ mode, text: input, lang, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Błąd serwera (${res.status})`);
      }

      setOutput(data.output || (lang === "pl" ? "Brak wyniku" : "No result"));
      setDailyWordsUsed((prev) => prev + wordCount);
    } catch (err: any) {
      console.error(err);
      setOutput(
        lang === "pl"
          ? `Błąd: ${err.message || "Problem z serwerem (500)"}`
          : `Error: ${err.message || "Server error (500)"}`
      );
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert(lang === "pl" ? "Nie udało się skopiować" : "Failed to copy");
    }
  };

  // Poprawiona funkcja Wklej
  const pasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setInput(text);
        // Opcjonalnie: focus na textarea po wklejeniu
        inputRef.current?.focus();
      } else {
        alert(lang === "pl" ? "Schowek jest pusty" : "Clipboard is empty");
      }
    } catch (err) {
      console.error("Paste failed:", err);
      alert(lang === "pl" ? "Nie udało się wkleić tekstu" : "Failed to paste text");
    }
  };

  const stats = (text: string) => ({
    chars: text.length,
    words: text.trim().split(/\s+/).filter(Boolean).length,
  });

  const inputStats = stats(input);
  const outputStats = stats(output);

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">{t("title")}</h1>

        <div className="flags">
          <button onClick={() => setLang("pl")} className={`flag-btn ${lang === "pl" ? "active" : ""}`}>
            🇵🇱
          </button>
          <button onClick={() => setLang("en")} className={`flag-btn ${lang === "en" ? "active" : ""}`}>
            🇬🇧
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-4 gap-3">
        <button onClick={enterAsAdmin} className="px-6 py-2 bg-yellow-600 text-white rounded">
          {t("adminBtn")}
        </button>
        <button onClick={setStandardRole} className="px-6 py-2 bg-green-600 text-white rounded">
          {t("standard")}
        </button>
      </div>

      <div className="text-center mt-2 text-yellow-400 font-bold">
        {lang === "pl" ? "Aktualna rola:" : "Current role:"} {role.toUpperCase()}
      </div>

      <div className="editor-grid flex-1 min-h-0">
        {/* WYJŚCIE */}
        <div className="panel">
          <div className="panel-header">{t("output")}</div>
          <div className="textarea-wrapper output-wrapper">
            <div className="textarea whitespace-pre-wrap overflow-y-auto max-h-[320px]">
              {loading ? t("loading") : output || (lang === "pl" ? "Tu pojawi się wynik" : "Result will appear here")}
            </div>
            {output && !loading && (
              <button onClick={copyOutput} className="copy-btn">
                {copied ? t("copied") : t("copy")}
              </button>
            )}
          </div>
          <div className="counter">
            {t("chars")}: {outputStats.chars} | {t("words")}: {outputStats.words}
          </div>
        </div>

        {/* WEJŚCIE */}
        <div className="panel">
          <div className="panel-header">{t("input")}</div>
          <div className="textarea-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="textarea"
              placeholder={lang === "pl" ? "Wpisz lub wklej tekst tutaj..." : "Type or paste text here..."}
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

      <div className="actions">
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj" disabled={loading}>
          {t("edit")}
        </button>

        {(role === "standard" || role === "pro" || role === "premium" || role === "admin_premium") && (
          <button onClick={() => handleAction("skroc")} className="btn btn-skroc" disabled={loading}>
            {t("shorten")}
          </button>
        )}

        {(role === "pro" || role === "premium" || role === "admin_premium") && (
          <button onClick={() => handleAction("formalny")} className="btn btn-formalny" disabled={loading}>
            {t("formal")}
          </button>
        )}

        {(role === "premium" || role === "admin_premium") && (
          <button onClick={() => handleAction("translate")} className="btn btn-translate" disabled={loading}>
            {t("translate")}
          </button>
        )}

        {role === "admin_premium" && (
          <button onClick={() => handleAction("research")} className="btn btn-translate" disabled={loading}>
            {t("research")}
          </button>
        )}
      </div>
    </div>
  );
}