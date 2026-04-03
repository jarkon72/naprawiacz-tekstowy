"use client";
import { useEffect, useState, useRef } from "react";
import { getUserId } from "@/lib/user";

type Mode = "edytuj" | "skroc" | "formalny";

const MAX_CHARS = 38000;

export default function Main() {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(1500);

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

  // Ładowanie danych użytkownika (plan + usage)
  useEffect(() => {
    const loadUserData = async () => {
      const userId = await getUserId();
      const res = await fetch(`/api/usage?userId=${userId}`);
      const data = await res.json();

      setPlan(data.plan || "free");
      setUsage(data.used || 0);
      setLimit(data.limit || 1500);
    };

    loadUserData();
    const interval = setInterval(loadUserData, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleRun(mode: Mode) {
    if (!input.trim()) {
      setError(t("noText"));
      return;
    }
    if (input.length > MAX_CHARS) {
      setError("Tekst jest za długi");
      return;
    }

    const userId = await getUserId();

    setLoading(true);
    setError("");
    setOutput("Przetwarzam...");

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input, lang, userId }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setOutput("");
        return;
      }

      setOutput(data.output || "Brak wyniku");
    } catch (err: any) {
      setError(err.message || "Błąd połączenia");
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

  const isFree = !plan || plan === "free";
  const isPro = plan?.startsWith("pro");
  const isPremium = plan?.startsWith("premium");
  const remaining = Math.max(0, limit - usage);

  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="header">
        <h1 className="title">{t("title")}</h1>
        
        <div style={{ fontSize: "13px", opacity: 0.85, textAlign: "center" }}>
          Plan: <strong>{plan?.toUpperCase() || "FREE"}</strong> | 
          Użyte: <strong>{usage}</strong> / {limit} | 
          Pozostało: <strong>{remaining}</strong>
        </div>

        <div className="flags">
          <button onClick={() => setLang("pl")} className={`flag-btn ${lang === "pl" ? "active" : ""}`}>🇵🇱</button>
          <button onClick={() => setLang("en")} className={`flag-btn ${lang === "en" ? "active" : ""}`}>🇬🇧</button>
        </div>
      </div>

      {/* EDITOR GRID */}
      <div className="editor-grid">
        <div className="result-section">
          <h2>{t("result")}</h2>
          <div className="result-box">
            {loading ? "Przetwarzam..." : output || "Tu pojawi się wynik"}
            {output && output.trim() && (
              <button onClick={copyToClipboard} className="copy-btn">{t("copy")}</button>
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
      </div>

      {/* ACTIONS */}
      <div className="actions">
        <button
          onClick={() => handleRun("edytuj")}
          disabled={loading || !input.trim() || overLimit}
          className="btn btn-edytuj"
        >
          {loading ? "..." : "Edytuj"}
        </button>

        <button
          onClick={() => handleRun("skroc")}
          disabled={loading || !input.trim() || overLimit || isFree}
          className="btn btn-skroc"
        >
          {loading ? "..." : "Skróć"}
        </button>

        <button
          onClick={() => handleRun("formalny")}
          disabled={loading || !input.trim() || overLimit || !(isPro || isPremium)}
          className="btn btn-formalny"
        >
          {loading ? "..." : "Sformalizuj"}
        </button>
      </div>

      {error && <p className="error-text mt-4 text-red-500 font-medium">{error}</p>}
    </div>
  );
}