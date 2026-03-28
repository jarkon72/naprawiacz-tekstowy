"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate" | "research";

export default function Home() {
  const [lang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<
    "free" | "day" | "standard" | "pro" | "premium" | "admin_premium"
  >("free");
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
      research: "Uzupełnij",
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
    day: 8000,
    standard: 10000,
    pro: 25000,
    premium: 50000,
    admin_premium: Infinity,
  };

  // === ADMIN Z HASŁEM (tylko Ty znasz sposób) ===
  const enterAsAdmin = () => {
    const password = prompt("Podaj hasło Administratora:");
    if (password === "twoje_haslo_tutaj") {   // ← ZMIEŃ NA SWOJE HASŁO
      setRole("admin_premium");
      alert("✅ Admin Premium aktywny");
    } else if (password) {
      alert("❌ Nieprawidłowe hasło");
    }
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
      setDailyWordsUsed((prev) => prev + wordCount);
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

      {/* Pasek planów dla klientów */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        <button onClick={() => setRole("free")} className={`btn ${role === "free" ? "opacity-100 scale-105" : "opacity-50"}`}>Free</button>
        <button onClick={() => setRole("day")} className={`btn ${role === "day" ? "opacity-100 scale-105" : "opacity-50"}`}>Day</button>
        <button onClick={() => setRole("standard")} className={`btn ${role === "standard" ? "opacity-100 scale-105" : "opacity-50"}`}>Standard</button>
        <button onClick={() => setRole("pro")} className={`btn ${role === "pro" ? "opacity-100 scale-105" : "opacity-50"}`}>Pro</button>
        <button onClick={() => setRole("premium")} className={`btn ${role === "premium" ? "opacity-100 scale-105" : "opacity-50"}`}>Premium</button>
      </div>

      <div className="text-center mt-2 text-yellow-400 font-bold">
        Aktualna rola: {role.toUpperCase()}
      </div>

      {/* Pola tekstowe */}
      <div className="editor-grid flex-1 min-h-0">
        <div className="panel">
          <div className="panel-header">{t("output")}</div>
          <div className="textarea-wrapper">
            <div className="textarea whitespace-pre-wrap">
              {loading ? t("loading") : output || "Tu pojawi się wynik"}
            </div>
            {output && <button onClick={copyOutput} className="copy-btn">{t("copy")}</button>}
          </div>
          <div className="counter">
            {t("chars")}: {outputStats.chars} | {t("words")}: {outputStats.words}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">{t("input")}</div>
          <div className="textarea-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="textarea"
            />
            <button onClick={pasteInput} className="paste-btn">{t("paste")}</button>
          </div>
          <div className="counter">
            {t("chars")}: {inputStats.chars} | {t("words")}: {inputStats.words}
          </div>
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="actions">
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj">Edytuj</button>
        
        <button
          onClick={() => role === "free" ? alert("Upgrade required") : handleAction("skroc")}
          className={`btn btn-skroc ${role === "free" ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Skróć {role === "free" && "🔒"}
        </button>

        <button
          onClick={() => (role === "free" || role === "day") ? alert("Upgrade required") : handleAction("formalny")}
          className={`btn btn-formalny ${(role === "free" || role === "day") ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Sformalizuj {(role === "free" || role === "day") && "🔒"}
        </button>

        <button
          onClick={() => (role !== "premium" && role !== "admin_premium") ? alert("Upgrade required") : handleAction("translate")}
          className={`btn btn-translate ${(role !== "premium" && role !== "admin_premium") ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Przetłumacz {(role !== "premium" && role !== "admin_premium") && "🔒"}
        </button>

        {/* Przycisk Research tylko dla Admina */}
        {role === "admin_premium" && (
          <button
            onClick={() => handleAction("research")}
            className="btn btn-research"
          >
            🔍 Uzupełnij
          </button>
        )}
      </div>
    </div>
  );
}