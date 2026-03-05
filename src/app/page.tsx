"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate";

export default function Home() {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("speakleash/bielik-11b-v3.0-instruct:q5_k_m");
  const [role, setRole] = useState<"free" | "pro" | "premium" | "admin_premium">("free");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [dailyWordsUsed, setDailyWordsUsed] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hasło admina – musi być NEXT_PUBLIC_, bo to komponent kliencki
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // Debug – sprawdź w konsoli przeglądarki (F12 → Console)
  console.log("Hasło wczytane:", ADMIN_PASSWORD);

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
      modelLabel: "Model:",
      longTextWarning: "Tekst ma ponad 15 000 znaków – przetwarzanie może trwać kilka minut. Kontynuować?",
      dailyLimitReached: "Osiągnąłeś dzienny limit słów dla tej roli. Przejdź na wyższy plan lub poczekaj do jutra.",
    };
    const en = {
      title: "Text Editor",
      input: "Input Text",
      output: "Output Text",
      edit: "Edit",
      shorten: "Shorten",
      formal: "Formalize",
      translate: "Translate",
      loading: "Processing...",
      noText: "Enter text!",
      copy: "Copy",
      paste: "Paste",
      chars: "chars",
      words: "words",
      modelLabel: "Model:",
      longTextWarning: "Text exceeds 15,000 characters – processing may take several minutes. Continue?",
      dailyLimitReached: "You have reached the daily word limit for this role. Upgrade or wait until tomorrow.",
    };
    return lang === "pl" ? pl[key as keyof typeof pl] : en[key as keyof typeof en];
  };

  // Limity słów dziennie
  const limits = {
    free: 1500,
    pro: 10000,
    premium: 50000,
    admin_premium: Infinity,
  };

  // Odczyt licznika z localStorage – TYLKO po stronie klienta
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("dailyWordsUsed");
    const today = new Date().toDateString();
    if (saved) {
      try {
        const { date, count } = JSON.parse(saved);
        if (date === today) {
          setDailyWordsUsed(count);
        } else {
          setDailyWordsUsed(0);
          localStorage.setItem("dailyWordsUsed", JSON.stringify({ date: today, count: 0 }));
        }
      } catch (e) {
        console.error("Błąd parsowania dailyWordsUsed:", e);
        setDailyWordsUsed(0);
      }
    } else {
      setDailyWordsUsed(0);
      localStorage.setItem("dailyWordsUsed", JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  // Zapis po każdej zmianie
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    localStorage.setItem("dailyWordsUsed", JSON.stringify({ date: today, count: dailyWordsUsed }));
  }, [dailyWordsUsed]);

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
    if (input.length > 15000) {
      if (!confirm(t("longTextWarning"))) return;
    }
    setLoading(true);
    setOutput(t("loading"));
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input, lang, model: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Błąd serwera");
      }
      setOutput(data.output || "Brak wyniku");
      setDailyWordsUsed((prev) => prev + wordCount);
    } catch (err: any) {
      console.error("Błąd:", err);
      let errorMsg = "Błąd przetwarzania";
      if (err.message.includes("Failed to fetch")) {
        errorMsg = "Ollama nie odpowiada – uruchom 'ollama serve'";
      } else if (err.message.includes("timeout")) {
        errorMsg = "Przetwarzanie trwało zbyt długo – tekst za długi";
      } else {
        errorMsg = err.message || "Nieznany błąd";
      }
      setOutput(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    alert(lang === "pl" ? "Skopiowano!" : "Copied!");
  };

  const pasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      alert(lang === "pl" ? "Wklejono!" : "Pasted!");
    } catch (err) {
      alert(lang === "pl" ? "Nie udało się wkleić" : "Paste failed");
    }
  };

  const getStats = (text: string) => {
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return { chars, words };
  };

  const inputStats = getStats(input);
  const outputStats = getStats(output);

  const canShorten = role === "pro" || role === "premium" || role === "admin_premium";
  const canFormal = role === "pro" || role === "premium" || role === "admin_premium";
  const canTranslate = role === "premium" || role === "admin_premium";

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">{t("title")}</h1>
        <div className="flex items-center gap-6">
          <div className="flags">
            <button onClick={() => setLang("pl")} className={`flag-btn ${lang === "pl" ? "active" : ""}`}>
              🇵🇱
            </button>
            <button onClick={() => setLang("en")} className={`flag-btn ${lang === "en" ? "active" : ""}`}>
              🇬🇧
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300 font-medium">{t("modelLabel")}</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#2d3748] text-gray-100 border border-gray-600 rounded-md px-4 py-2 text-base focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40 min-w-[220px] cursor-pointer"
            >
              <option value="bielikbf16:latest">bielikbf16:latest</option>
              <option value="speakleash/bielik-11b-v3.0-instruct:q5_k_m">bielik-11b q5_k_m</option>
              <option value="trurl-13b-q6:latest">trurl-13b q6</option>
              <option value="qwen2.5:7b-instruct">qwen2.5 7b instruct</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pasek ról – cały pasek zmienia kolor na kolor wybranej roli */}
      <div className={`role-bar flex justify-center gap-4 mt-4 flex-wrap rounded-lg p-2 transition-all duration-300 ${
        role === "free" ? "bg-blue-900/30 border border-blue-500/50" :
        role === "pro" ? "bg-green-900/30 border border-green-500/50" :
        role === "premium" ? "bg-purple-900/30 border border-purple-500/50" :
        "bg-yellow-900/30 border border-yellow-500/50"
      }`}>
        <button
          onClick={() => setRole("free")}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
            role === "free"
              ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400 scale-105"
              : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Free
        </button>
        <button
          onClick={() => setRole("pro")}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
            role === "pro"
              ? "bg-green-600 text-white shadow-lg ring-2 ring-green-400 scale-105"
              : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Pro
        </button>
        <button
          onClick={() => setRole("premium")}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
            role === "premium"
              ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400 scale-105"
              : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Premium
        </button>
        <button
          onClick={() => setShowAdminLogin(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
            role === "admin_premium"
              ? "bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-400 scale-105"
              : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Admin
        </button>
      </div>

      {/* Widoczny debug roli */}
      <div className="text-center mt-2 text-lg font-bold text-yellow-400">
        Aktualna rola: {role.toUpperCase()}
      </div>

      {/* Modal logowania admina */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] p-8 rounded-xl border border-gray-600 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-6 text-white text-center">Logowanie Admin Premium</h2>
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              placeholder="Podaj hasło"
              className="w-full p-3 mb-6 bg-[#0f172a] border border-gray-600 rounded text-white text-lg focus:outline-none focus:border-[#8b5cf6]"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (adminPasswordInput === ADMIN_PASSWORD) {
                    setRole("admin_premium");
                    setShowAdminLogin(false);
                    setAdminPasswordInput("");
                    alert("Zalogowano jako Admin Premium – wszystkie funkcje odblokowane!");
                  } else {
                    alert("Błędne hasło");
                  }
                }}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 text-lg font-medium"
              >
                Zaloguj
              </button>
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminPasswordInput("");
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 text-lg font-medium"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="editor-grid">
        <div className="panel">
          <div className="panel-header">{t("output")}</div>
          <div className="textarea-wrapper">
            <div className="textarea whitespace-pre-wrap overflow-y-auto h-full p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  {t("loading")}
                </div>
              ) : output.includes("Błąd") || output.includes("nie odpowiada") || output.includes("timeout") ? (
                <div className="text-red-400 whitespace-pre-wrap">
                  {output}
                </div>
              ) : (
                output || "Tu pojawi się wynik"
              )}
            </div>
            {output && !output.includes("Błąd") && (
              <button onClick={copyOutput} className="copy-btn">
                {t("copy")}
              </button>
            )}
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
              placeholder="Wpisz lub wklej tekst tutaj..."
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

      <div className="actions">
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj" disabled={loading}>
          {t("edit")}
        </button>

        {canShorten && (
          <button onClick={() => handleAction("skroc")} className="btn btn-skroc" disabled={loading}>
            {t("shorten")}
          </button>
        )}

        {canFormal && (
          <button onClick={() => handleAction("formalny")} className="btn btn-formalny" disabled={loading}>
            {t("formal")}
          </button>
        )}

        {canTranslate && (
          <button onClick={() => handleAction("translate")} className="btn btn-translate" disabled={loading}>
            {t("translate")}
          </button>
        )}
      </div>
    </div>
  );
}