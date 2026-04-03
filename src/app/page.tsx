"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate" | "research";
type Lang = "pl" | "en";
type Role = "free" | "day" | "standard" | "pro" | "premium" | "admin_premium";

// Model definitions per plan
const MODEL_OPTIONS: Record<Role, { value: string; label: string; tag?: string; tagColor?: string }[]> = {
  free: [
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "Szybki", tagColor: "#0f766e" },
  ],
  day: [
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "Szybki", tagColor: "#0f766e" },
  ],
  standard: [
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "Szybki", tagColor: "#0f766e" },
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "Polski", tagColor: "#b45309" },
  ],
  pro: [
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "Edycja", tagColor: "#1d4ed8" },
    { value: "qwen2.5:14b", label: "Qwen 2.5 14B", tag: "Generowanie", tagColor: "#7c3aed" },
  ],
  premium: [
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "Edycja", tagColor: "#1d4ed8" },
    { value: "qwen2.5:14b", label: "Qwen 2.5 14B", tag: "Generowanie", tagColor: "#7c3aed" },
    { value: "llama3.1:8b", label: "Llama 3.1", tag: "Kreatywny", tagColor: "#be185d" },
  ],
  admin_premium: [
    { value: "auto", label: "Auto", tag: "Zalecany", tagColor: "#065f46" },
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "Edycja PL", tagColor: "#1d4ed8" },
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "Szybki", tagColor: "#0f766e" },
    { value: "qwen2.5:14b", label: "Qwen 14B", tag: "Generowanie+", tagColor: "#7c3aed" },
    { value: "bielik:latest", label: "Bielik", tag: "Polski", tagColor: "#b45309" },
    { value: "openhermes:latest", label: "OpenHermes", tag: "Chat", tagColor: "#0369a1" },
    { value: "mistral:latest", label: "Mistral", tag: "Fast", tagColor: "#475569" },
    { value: "llama3.1:8b", label: "Llama 3.1", tag: "Kreatywny", tagColor: "#be185d" },
  ],
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("pl");
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [role, setRole] = useState<Role>("free");
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5:latest");
  const [usageData, setUsageData] = useState<{
    used: number; limit: number | null; remaining: number | null; percent: number; plan: string; resetInfo?: string;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = (key: string) => {
    const pl = {
      plan_free: "Darmowy", plan_day: "Dzień", plan_standard: "Standard",
      plan_pro: "Pro", plan_premium: "Premium", title: "Poprawiacz tekstu",
      input: "Tekst wejściowy", output: "Tekst wyjściowy", edit: "Edytuj",
      shorten: "Skróć", formal: "Sformalizuj", translate: "Przetłumacz",
      research: "Uzupełnij", loading: "Przetwarzam...", noText: "Wpisz tekst!",
      copy: "Kopiuj", paste: "Wklej", chars: "znaków", words: "słów",
      dailyLimitReached: "Limit osiągnięty", model: "Model",
    };
    const en = {
      plan_free: "Free", plan_day: "Day", plan_standard: "Standard",
      plan_pro: "Pro", plan_premium: "Premium", title: "Text Editor",
      input: "Input text", output: "Output text", edit: "Edit",
      shorten: "Shorten", formal: "Formalize", translate: "Translate",
      research: "Enhance", loading: "Processing...", noText: "Enter text!",
      copy: "Copy", paste: "Paste", chars: "chars", words: "words",
      dailyLimitReached: "Limit reached", model: "Model",
    };
    const dict = lang === "en" ? en : pl;
    return dict[key as keyof typeof pl];
  };

  const limits: Record<Role, number> = {
    free: 1500, day: 8000, standard: 12000,
    pro: 20000, premium: 50000, admin_premium: Infinity,
  };

  // When role changes, reset to first model for that plan
  useEffect(() => {
    const models = MODEL_OPTIONS[role];
    setSelectedModel(models[0].value);
  }, [role]);

  // Poll usage — userId comes from server cookie automatically
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/usage", { credentials: "include" });
        const data = await res.json();
        if (!data.error) {
          const limit = data.limit ?? null;
          const used = data.used ?? 0;
          const percent = limit ? Math.min(100, (used / limit) * 100) : 0;
          setUsageData({ ...data, percent });
        }
      } catch {}
    };
    fetchUsage();
    const interval = setInterval(fetchUsage, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/check-admin")
      .then((res) => res.json())
      .then((data) => {
        setRole(data.admin ? "admin_premium" : "free");
      });
  }, []);

  useEffect(() => {
    const firstUse = localStorage.getItem("free_first_use");
    const today = new Date().toISOString().slice(0, 10);
    if (!firstUse) localStorage.setItem("free_first_use", today);
  }, []);

  // Sprawdź czy limit wyczerpany (na podstawie danych z serwera)
  const isLimitExceeded =
    usageData !== null &&
    usageData.limit !== null &&
    usageData.remaining !== null &&
    usageData.remaining <= 0;

  async function handleAction(mode: Mode) {
    if (!input.trim()) { alert(t("noText")); return; }

    // Blokada frontendowa — szybka odpowiedź bez roundtrip
    if (isLimitExceeded) return;

    setLoading(true);
    setOutput(t("loading"));
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode, text: input, model: selectedModel }),
      });
      const data = await res.json();

      if (res.status === 429 && data.error === "LIMIT_EXCEEDED") {
        // Odśwież usage bar natychmiast
        const usageRes = await fetch("/api/usage", { credentials: "include" });
        const usageJson = await usageRes.json();
        if (!usageJson.error) {
          const limit = usageJson.limit ?? null;
          const used = usageJson.used ?? 0;
          const percent = limit ? Math.min(100, (used / limit) * 100) : 0;
          setUsageData({ ...usageJson, percent });
        }
        setOutput("");
        return;
      }

      if (data.error) {
        setOutput(`Błąd: ${data.message || data.error}`);
        return;
      }

      setOutput(data.output || "Brak wyniku");
    } catch {
      setOutput("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = () => navigator.clipboard.writeText(output);

  const stats = (text: string) => ({
    chars: text.length,
    words: text.trim().split(/\s+/).filter(Boolean).length,
  });

  const inputStats = stats(input);
  const outputStats = stats(output);
  const currentModels = MODEL_OPTIONS[role];

  function translateTag(tag?: string) {
  if (!tag) return "";

  const map: Record<string, string> = {
    "Szybki": "Fast",
    "Polski": "Polish",
    "Edycja": "Editing",
    "Edycja PL": "Editing PL",
    "Generowanie": "Generation",
    "Generowanie+": "Generation+",
    "Kreatywny": "Creative",
    "Chat": "Chat",
    "Fast": "Fast",
    "Zalecany": "Recommended",
  };

  return map[tag] || tag;
}

  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="header" style={{ padding: "0.5rem 1rem 0 1rem", flexShrink: 0 }}>
        <h1
          className="title"
          onDoubleClick={() => {
            const pass = prompt("Admin password:");
            if (!pass) return;
            fetch("/api/admin-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: pass }),
            }).then((res) => {
              if (res.ok) { alert("ADMIN MODE"); location.reload(); }
              else alert("Wrong password");
            });
          }}
        >
          {t("title")}
        </h1>
        <div className="flags">
          <button
            onClick={() => { localStorage.setItem("lang", "pl"); setLang("pl"); }}
            className={`flag-btn ${lang === "pl" ? "active" : ""}`}
          >
            <img src="https://flagcdn.com/w40/pl.png" width="28" height="20" alt="PL" />
          </button>
          <button
            onClick={() => { localStorage.setItem("lang", "en"); setLang("en"); }}
            className={`flag-btn ${lang === "en" ? "active" : ""}`}
          >
            <img src="https://flagcdn.com/w40/gb.png" width="28" height="20" alt="GB" />
          </button>
        </div>
      </div>

      {/* PLAN BUTTONS */}
      <div
        className="flex justify-center gap-2 mt-2 flex-wrap"
        style={{ flexShrink: 0, padding: "0 1rem" }}
      >
        {(["free", "day", "standard", "pro", "premium"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`btn ${role === r ? "opacity-100" : "opacity-50"}`}
          >
            {t(`plan_${r}`)}
          </button>
        ))}
      </div>

      {/* USAGE BAR */}
      {usageData && (
        <div className="usage-bar-wrap" style={{ flexShrink: 0 }}>
          <div className="usage-bar-header">
            <span className="usage-bar-label">
              Plan: <strong>{usageData.plan.toUpperCase()}</strong>
              &nbsp;|&nbsp;
              Użyte: <strong>{usageData.used.toLocaleString()}</strong>
              {usageData.limit !== null && <> / {usageData.limit.toLocaleString()} znaków</>}
              {usageData.remaining !== null && (
                <>&nbsp;|&nbsp;Pozostało: <strong>{usageData.remaining.toLocaleString()}</strong></>
              )}
              {usageData.resetInfo && (
                <>&nbsp;|&nbsp;<span style={{ color: "#f59e0b" }}>{usageData.resetInfo}</span></>
              )}
            </span>
            <span className="usage-bar-percent">
              {usageData.limit === null ? "∞" : `${Math.round(usageData.percent)}%`}
            </span>
          </div>
          {usageData.limit !== null && (
            <div className="usage-bar-track">
              <div
                className="usage-bar-fill"
                style={{
                  width: `${Math.max(usageData.percent, 2)}%`,
                  background:
                    usageData.percent > 90 ? "#ef4444" :
                    usageData.percent > 70 ? "#f59e0b" :
                    "#22c55e",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* MODEL SELECTOR PANEL */}
      <div className="model-panel" style={{ flexShrink: 0 }}>
        <div className="model-panel-header">
          <span className="model-panel-label">{t("model")}</span>
          <span className="model-limit">
            Limit: {role === "admin_premium" ? "∞" : `~${Math.round(limits[role] / 5)} ${t("words")}`}
          </span>
        </div>
        <div className="model-options">
          {currentModels.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedModel(m.value)}
              className={`model-chip ${selectedModel === m.value ? "model-chip-active" : ""}`}
            >
              <span className="model-chip-name">{m.label}</span>
              {m.tag && (
  <span
    className="model-chip-tag"
    style={{ background: m.tagColor || "#374151" }}
  >
    {lang === "pl" ? m.tag : translateTag(m.tag)}
  </span>
)}
            </button>
          ))}
        </div>
      </div>

      {/* EDITOR GRID */}
      <div className="editor-grid" style={{ marginTop: "0.4rem" }}>

        {/* OUTPUT PANEL */}
        <div className="panel">
          <div className="panel-header">{t("output")}</div>
          <div className="textarea-wrapper">
            <div style={{
              flex: 1, width: "100%", height: "100%",
              padding: "0.75rem 1rem", boxSizing: "border-box" as const,
              color: "white", whiteSpace: "pre-wrap" as const,
              wordBreak: "break-word" as const, overflowY: "scroll" as const,
              scrollbarWidth: "thin" as const,
              scrollbarColor: "#9ca3af #1f2937", background: "transparent",
            }}>
              {loading ? t("loading") : output || "Tu pojawi się wynik"}
            </div>
            {output && (
              <button onClick={copyOutput} className="copy-btn">{t("copy")}</button>
            )}
          </div>
          <div className="counter">
            {t("chars")}: {outputStats.chars} | {t("words")}: {outputStats.words}
          </div>
        </div>

        {/* INPUT PANEL */}
        <div className="panel">
          <div className="panel-header">{t("input")}</div>
          <div className="textarea-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="textarea"
              style={{ paddingTop: "0.75rem" }}
            />
          </div>
          <div className="counter">
            {t("chars")}: {inputStats.chars} | {t("words")}: {inputStats.words}
          </div>
        </div>

      </div>

      {/* LIMIT EXCEEDED OVERLAY */}
      {isLimitExceeded && (
        <div className="limit-overlay">
          <div className="limit-overlay-icon">🔒</div>
          <div className="limit-overlay-title">
            {lang === "pl" ? "Limit wyczerpany" : "Limit reached"}
          </div>
          <div className="limit-overlay-sub">
            {usageData?.resetInfo
              ? (lang === "pl" ? `Odnowienie: ` : `Resets: `) + usageData.resetInfo
              : lang === "pl" ? "Kup dostęp aby kontynuować" : "Buy access to continue"}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className={`actions ${isLimitExceeded ? "actions-blocked" : ""}`}>
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj">
          {t("edit")}
        </button>
        <button
          onClick={() => role === "free" ? alert("Upgrade required") : handleAction("skroc")}
          className={`btn btn-skroc ${role === "free" ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {t("shorten")} {role === "free" && "🔒"}
        </button>
        <button
          onClick={() => (role === "free" || role === "day") ? alert("Upgrade required") : handleAction("formalny")}
          className={`btn btn-formalny ${(role === "free" || role === "day") ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {t("formal")} {(role === "free" || role === "day") && "🔒"}
        </button>
        <button
          onClick={() => (role !== "premium" && role !== "admin_premium") ? alert("Upgrade required") : handleAction("translate")}
          className={`btn btn-translate ${(role !== "premium" && role !== "admin_premium") ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {t("translate")} {(role !== "premium" && role !== "admin_premium") && "🔒"}
        </button>
        {role === "admin_premium" && (
          <button onClick={() => handleAction("research")} className="btn btn-research">
            🔍 {t("research")}
          </button>
        )}
      </div>

    </div>
  );
}
