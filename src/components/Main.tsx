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
        body: JSON.stringify({ mode, text: input, lang, userId, modelMode }),
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

  const remaining = Math.max(0, limit - usage);
  const percent = limit > 0 ? Math.min(100, (usage / limit) * 100) : 0;

  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="header">

        {/* LEWA STRONA */}
        <div>
          <h1 className="title">{t("title")}</h1>

          <div style={{ fontSize: "13px", opacity: 0.85, marginTop: 6 }}>
           Plan: <strong>{plan?.toUpperCase() || "FREE"}</strong> | 
Użyte: <strong>{usage}</strong> / {limit} | 
Pozostało: <strong>{remaining}</strong>

{/* 🔥 TU WKLEJ */}
<div style={{ marginTop: 6 }}>
  <select
    value={modelMode}
    onChange={(e) => setModelMode(e.target.value as any)}
    style={{
      background: "#0d1117",
      color: "#cbd5e1",
      border: "1px solid #1a2535",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 12
    }}
  >
    <option value="auto">🤖 Auto</option>
    <option value="fast">⚡ Szybki</option>
    <option value="quality">🎯 Dokładny</option>
    <option value="creative">✨ Kreatywny</option>
  </select>
</div>

{/* PROGRESS BAR */}
<div style={{ width: "100%", maxWidth: 300, marginTop: 6 }}>
              <div style={{
                height: 6,
                background: "#1a2535",
                borderRadius: 6,
                overflow: "hidden"
              }}>
                <div style={{
  width: `${Math.max(percent, 3)}%`,
  height: "100%",
  background: percent > 90 ? "#ef4444" : percent > 70 ? "#f59e0b" : "#22c55e",
  transition: "width 0.4s ease",

  boxShadow:
    percent > 90
      ? "0 0 12px #ef4444, 0 0 24px #ef4444"
      : percent > 70
      ? "0 0 10px #f59e0b"
      : "none",

  animation: percent > 90 ? "pulse 1s infinite" : "none",
}} />

animation: percent > 90 ? "pulse 1s infinite" : "none",

  // 🔥 GLOW
  boxShadow:
    percent > 90
      ? "0 0 12px #ef4444, 0 0 24px #ef4444"
      : percent > 70
      ? "0 0 10px #f59e0b"
      : "none"
}} />
              </div>
            </div>
          </div>
        </div>

        {/* PRAWA STRONA */}
        <div className="flags">
          <button onClick={() => setLang("pl")} className={`flag-btn ${lang === "pl" ? "active" : ""}`}>🇵🇱</button>
          <button onClick={() => setLang("en")} className={`flag-btn ${lang === "en" ? "active" : ""}`}>🇬🇧</button>
        </div>

      </div>

      {/* RESZTA BEZ ZMIAN */}
    </div>
  );
}