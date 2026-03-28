"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate" | "research";

export default function Home() {
  const [lang, setLang] = useState<"pl" | "en">("pl");
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
      plan_free: "Darmowy",
      plan_day: "Dzień",
      plan_standard: "Standard",
      plan_pro: "Pro",
      plan_premium: "Premium",

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

    const en = {
      plan_free: "Free",
      plan_day: "Day",
      plan_standard: "Standard",
      plan_pro: "Pro",
      plan_premium: "Premium",

      title: "Text Editor",
      input: "Input text",
      output: "Output text",
      edit: "Edit",
      shorten: "Shorten",
      formal: "Formalize",
      translate: "Translate",
      research: "Enhance",
      loading: "Processing...",
      noText: "Enter text!",
      copy: "Copy",
      paste: "Paste",
      chars: "chars",
      words: "words",
      dailyLimitReached: "Limit reached",
    };

    const dict = lang === "en" ? en : pl;
    return dict[key as keyof typeof pl];
  };

  const limits = {
  free: 1500,
  day: 8000,
  standard: 12000,
  pro: 20000,
  premium: 50000,
  admin_premium: 150000, // 🔥 TO
};

  useEffect(() => {
    fetch("/api/check-admin")
      .then(res => res.json())
      .then(data => {
        if (data.admin) {
          setRole("admin_premium");
        } else {
          setRole("free");
        }
      });
  }, []);
  
  useEffect(() => {
  const firstUse = localStorage.getItem("free_first_use");
  const today = new Date().toISOString().slice(0, 10);

  if (!firstUse) {
    localStorage.setItem("free_first_use", today);
  }
}, []);

function isFreeBlocked() {
  const firstUse = localStorage.getItem("free_first_use");
  if (!firstUse) return false;

  const start = new Date(firstUse);
  const now = new Date();

  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return diff >= 6;
}

  async function handleAction(mode: Mode) {
	  
	if (role === "free" && isFreeBlocked()) {
      alert("Free limit reached. Buy access.");
      return;
   }  
    if (!input.trim()) return alert(t("noText"));

    const charCount = input.length;
    const limit = limits[role];

   if (dailyWordsUsed + charCount > limit && role !== "admin_premium") {
      return alert(t("dailyLimitReached"));
    }

    setLoading(true);
    setOutput(t("loading"));

    try {
      const res = await fetch("/api/transform", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // 🔥 TO DODAJESZ
  body: JSON.stringify({ mode, text: input }),
});

      const data = await res.json();
      setOutput(data.output || "Brak wyniku");
      setDailyWordsUsed((prev) => prev + charCount);
    } catch {
      setOutput("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = () => navigator.clipboard.writeText(output);

  const stats = (t: string) => ({
    chars: t.length,
    words: t.trim().split(/\s+/).filter(Boolean).length,
  });

  const inputStats = stats(input);
  const outputStats = stats(output);

  return (
    <div className="app-container">
      <div className="header">
        <h1
          className="title"
          onDoubleClick={() => {
            const pass = prompt("Admin password:");
            if (!pass) return;

            fetch("/api/admin-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: pass })
            }).then(res => {
              if (res.ok) {
                alert("ADMIN MODE");
                location.reload();
              } else {
                alert("Wrong password");
              }
            });
          }}
        >
          {t("title")}
        </h1>

        <div style={{ position: "absolute", top: 10, right: 20 }}>
          <button onClick={() => { localStorage.setItem("lang", "pl"); setLang("pl"); }} style={{ fontSize: "20px", marginRight: "8px" }}>🇵🇱</button>
          <button onClick={() => { localStorage.setItem("lang", "en"); setLang("en"); }} style={{ fontSize: "20px" }}>🇬🇧</button>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        <button onClick={() => setRole("free")} className={`btn ${role === "free" ? "opacity-100 scale-105" : "opacity-50"}`}>{t("plan_free")}</button>
        <button onClick={() => setRole("day")} className={`btn ${role === "day" ? "opacity-100 scale-105" : "opacity-50"}`}>{t("plan_day")}</button>
        <button onClick={() => setRole("standard")} className={`btn ${role === "standard" ? "opacity-100 scale-105" : "opacity-50"}`}>{t("plan_standard")}</button>
        <button onClick={() => setRole("pro")} className={`btn ${role === "pro" ? "opacity-100 scale-105" : "opacity-50"}`}>{t("plan_pro")}</button>
        <button onClick={() => setRole("premium")} className={`btn ${role === "premium" ? "opacity-100 scale-105" : "opacity-50"}`}>{t("plan_premium")}</button>
      </div>

      <div className="text-center mt-2 text-yellow-400 font-bold">
        Aktualna rola: {role.toUpperCase()} | Limit: ~{Math.round(limits[role] / 5)} {t("words")}
      </div>

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
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} className="textarea" />
          </div>
          <div className="counter">
            {t("chars")}: {inputStats.chars} | {t("words")}: {inputStats.words}
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj">{t("edit")}</button>
        <button onClick={() => role === "free" ? alert("Upgrade required") : handleAction("skroc")} className={`btn btn-skroc ${role === "free" ? "opacity-40 cursor-not-allowed" : ""}`}>{t("shorten")} {role === "free" && "🔒"}</button>
        <button onClick={() => (role === "free" || role === "day") ? alert("Upgrade required") : handleAction("formalny")} className={`btn btn-formalny ${(role === "free" || role === "day") ? "opacity-40 cursor-not-allowed" : ""}`}>{t("formal")} {(role === "free" || role === "day") && "🔒"}</button>
        <button onClick={() => (role !== "premium" && role !== "admin_premium") ? alert("Upgrade required") : handleAction("translate")} className={`btn btn-translate ${(role !== "premium" && role !== "admin_premium") ? "opacity-40 cursor-not-allowed" : ""}`}>{t("translate")} {(role !== "premium" && role !== "admin_premium") && "🔒"}</button>

        {role === "admin_premium" && (
          <button onClick={() => handleAction("research")} className="btn btn-research">
            🔍 {t("research")}
          </button>
        )}
      </div>
    </div>
  );
}