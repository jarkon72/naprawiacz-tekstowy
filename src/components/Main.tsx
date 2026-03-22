"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny";

const MAX_CHARS = 38000;

export default function Main() {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = (key: string) => {
    const pl = {
      title: "Poprawiacz tekstu",
      result: "Wynik:",
      edit: "Edytuj",
      shorten: "Skróć",
      formal: "Sformalizuj",
      loading: "Przetwarzam...",
      noText: "Wpisz tekst!",
      copy: "Kopiuj",
    };
    const en = {
      title: "Text Corrector",
      result: "Result:",
      edit: "Edit",
      shorten: "Shorten",
      formal: "Formalize",
      loading: "Processing...",
      noText: "Enter text!",
      copy: "Copy",
    };
    return lang === "pl" ? pl[key as keyof typeof pl] : en[key as keyof typeof en];
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleRun(mode: Mode) {
    if (!input.trim()) return setError(t("noText"));
    if (input.length > MAX_CHARS) return setError("Tekst za długi");

    setLoading(true);
    setError("");
    setOutput("Przetwarzam...");

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input, lang }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setOutput(data.output || "Brak wyniku");
    } catch (err: any) {
      setError(err.message || "Błąd przetwarzania");
      setOutput("");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output.trim());
    alert("Skopiowano!");
  };

  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">{t("title")}</h1>
        <div className="flags">
          <button
            onClick={() => setLang("pl")}
            className={`flag-btn ${lang === "pl" ? "active" : ""}`}
          >
            🇵🇱
          </button>
          <button
            onClick={() => setLang("en")}
            className={`flag-btn ${lang === "en" ? "active" : ""}`}
          >
            🇬🇧
          </button>
        </div>
      </div>

      <div className="result-section">
        <h2>{t("result")}</h2>
        <div className="result-box">
          {loading ? "Przetwarzam..." : output || "Tu pojawi się wynik"}
          {output && output.trim() && (
            <button onClick={copyToClipboard} className="copy-btn">
              {t("copy")}
            </button>
          )}
        </div>
      </div>

      <div className="input-section">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Wpisz lub wklej tekst tutaj..."
          disabled={loading}
          className="textarea"
        />
        <div className="text-right mt-2 text-sm text-gray-400">
          {charCount} / {MAX_CHARS}
          {overLimit && <span className="text-red-500 ml-2">przekroczono!</span>}
        </div>
      </div>

      <div className="buttons-container">
        <button
          onClick={() => handleRun("edytuj")}
          disabled={loading || !input.trim() || overLimit}
          className="btn btn-edytuj"
        >
          {loading ? "..." : "Edytuj"}
        </button>

        <button
          onClick={() => handleRun("skroc")}
          disabled={loading || !input.trim() || overLimit}
          className="btn btn-skroc"
        >
          {loading ? "..." : "Skróć"}
        </button>

        <button
          onClick={() => handleRun("formalny")}
          disabled={loading || !input.trim() || overLimit}
          className="btn btn-formalny"
        >
          {loading ? "..." : "Sformalizuj"}
        </button>
      </div>

      {error && <p className="error-text mt-4">{error}</p>}
    </div>
  );
}    
