"use client";
import { useEffect, useState, useRef } from "react";
import { getUserId } from "@/lib/user";

type Mode = "edytuj" | "skroc" | "formalny" | "tlumacz" | "research";

const MAX_CHARS = 38000;

// ─── Modele do wyboru ─────────────────────────────────────────────────────────
const MODEL_OPTIONS = [
  { value: "auto",     label: "Auto",      tag: "",     tagColor: "" },
  { value: "fast",     label: "Fast",      tag: "⚡",   tagColor: "#0f766e" },
  { value: "quality",  label: "Quality",   tag: "🎯",   tagColor: "#1d4ed8" },
  { value: "creative", label: "Creative",  tag: "✨",   tagColor: "#7c3aed" },
];

export default function Main() {
  const [lang, setLang]           = useState<"pl" | "en">("pl");
  const [input, setInput]         = useState("");
  const [output, setOutput]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [plan, setPlan]           = useState<string | null>(null);
  const [usage, setUsage]         = useState<number>(0);
  const [limit, setLimit]         = useState<number>(1500);
  const [modelMode, setModelMode] = useState("auto");
  const [copied, setCopied]       = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── tłumaczenia ──────────────────────────────────────────────────────────────
  const T = {
    pl: {
      title: "Poprawiacz tekstu",
      inputLabel: "TEKST WEJŚCIOWY",
      outputLabel: "WYNIK",
      edit: "Edytuj",
      shorten: "Skróć",
      formal: "Sformalizuj",
      translate: "Tłumacz",
      research: "Research",
      loading: "Przetwarzam...",
      noText: "Wpisz tekst!",
      copy: "Kopiuj",
      copied: "Skopiowano!",
      plan: "Plan",
      used: "Użyte",
      remaining: "Pozostało",
      model: "MODEL",
    },
    en: {
      title: "Text Corrector",
      inputLabel: "INPUT TEXT",
      outputLabel: "RESULT",
      edit: "Edit",
      shorten: "Shorten",
      formal: "Formalize",
      translate: "Translate",
      research: "Research",
      loading: "Processing...",
      noText: "Enter text!",
      copy: "Copy",
      copied: "Copied!",
      plan: "Plan",
      used: "Used",
      remaining: "Remaining",
      model: "MODEL",
    },
  };
  const t = (key: keyof typeof T.pl) => T[lang][key];

  // ── focus on mount ────────────────────────────────────────────────────────────
  useEffect(() => { textareaRef.current?.focus(); }, []);

  // ── ładuj dane użytkownika co 3s ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const userId = await getUserId();
      const res = await fetch(`/api/usage?userId=${userId}`);
      const data = await res.json();
      setPlan(data.plan || "free");
      setUsage(data.used || 0);
      setLimit(data.limit || 1500);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── główna akcja ──────────────────────────────────────────────────────────────
  async function handleRun(mode: Mode) {
    if (!input.trim()) { setError(t("noText")); return; }

    const userId = await getUserId();
    setLoading(true);
    setError("");
    setOutput(t("loading"));

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input, model: modelMode, plan }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error === "LIMIT_EXCEEDED"
          ? "Dzienny limit wyczerpany. Kup wyższy plan lub wróć jutro."
          : data.error);
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

  // ── kopiowanie ────────────────────────────────────────────────────────────────
  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const remaining = Math.max(0, limit - usage);
  const percent   = limit > 0 ? Math.min(100, (usage / limit) * 100) : 0;
  const limitHit  = plan !== "admin" && plan !== "admin_premium" && usage >= limit;

  return (
    <div className="app-container">

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="header">
        <div>
          <h1 className="title">{t("title")}</h1>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
            {t("plan")}: <strong>{plan?.toUpperCase() || "FREE"}</strong> &nbsp;|&nbsp;
            {t("used")}: <strong>{usage}</strong> / {limit} &nbsp;|&nbsp;
            {t("remaining")}: <strong>{remaining}</strong>
            <div style={{ width: "100%", maxWidth: 300, marginTop: 6 }}>
              <div style={{ height: 6, background: "#1a2535", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(percent, 3)}%`,
                  height: "100%",
                  background: percent > 90 ? "#ef4444" : percent > 70 ? "#f59e0b" : "#22c55e",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flags">
          <button onClick={() => setLang("pl")} className={`flag-btn ${lang === "pl" ? "active" : ""}`}>🇵🇱</button>
          <button onClick={() => setLang("en")} className={`flag-btn ${lang === "en" ? "active" : ""}`}>🇬🇧</button>
        </div>
      </div>

      {/* ── MODEL SELECTOR ────────────────────────────────────────────────────── */}
      <div className="model-panel">
        <div className="model-panel-header">
          <span className="model-panel-label">{t("model")}</span>
        </div>
        <div className="model-options">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setModelMode(m.value)}
              className={`model-chip ${modelMode === m.value ? "model-chip-active" : ""}`}
            >
              {m.tag && <span>{m.tag}</span>}
              <span className="model-chip-name">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LIMIT EXCEEDED BANNER ─────────────────────────────────────────────── */}
      {limitHit && (
        <div className="limit-overlay">
          <span className="limit-overlay-icon">🚫</span>
          <span className="limit-overlay-title">Dzienny limit wyczerpany</span>
          <span className="limit-overlay-sub">Wróć jutro lub kup wyższy plan</span>
        </div>
      )}

      {/* ── EDITOR GRID ───────────────────────────────────────────────────────── */}
      <div className={`editor-grid ${limitHit ? "actions-blocked" : ""}`}>

        {/* INPUT */}
        <div className="panel">
          <div className="panel-header">{t("inputLabel")}</div>
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="textarea"
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setInput(e.target.value);
              }}
              placeholder={lang === "pl" ? "Wklej lub wpisz tekst..." : "Paste or type text..."}
              disabled={loading}
            />
          </div>
          <div className="counter">{input.length} / {MAX_CHARS}</div>
        </div>

        {/* OUTPUT */}
        <div className="panel">
          <div className="panel-header">{t("outputLabel")}</div>
          <div className="textarea-wrapper">
            <textarea
              className="textarea"
              value={output}
              readOnly
              placeholder={lang === "pl" ? "Tutaj pojawi się wynik..." : "Result will appear here..."}
            />
            {output && (
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? t("copied") : t("copy")}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── ERROR ─────────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ textAlign: "center", color: "#f87171", fontSize: 13, padding: "4px 1rem" }}>
          {error}
        </div>
      )}

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────────── */}
      <div className={`actions ${limitHit ? "actions-blocked" : ""}`}>
        <button
          className="btn btn-edytuj"
          onClick={() => handleRun("edytuj")}
          disabled={loading}
        >
          {loading ? t("loading") : t("edit")}
        </button>
        <button
          className="btn btn-skroc"
          onClick={() => handleRun("skroc")}
          disabled={loading}
        >
          {t("shorten")}
        </button>
        <button
          className="btn btn-formalny"
          onClick={() => handleRun("formalny")}
          disabled={loading}
        >
          {t("formal")}
        </button>
        <button
          className="btn btn-translate"
          onClick={() => handleRun("tlumacz")}
          disabled={loading}
        >
          {t("translate")}
        </button>
        <button
          className="btn btn-research"
          onClick={() => handleRun("research")}
          disabled={loading}
        >
          {t("research")}
        </button>
      </div>

    </div>
  );
}
