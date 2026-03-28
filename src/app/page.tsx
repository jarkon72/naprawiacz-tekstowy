"use client";
import { useEffect, useState, useRef } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "translate" | "research";

export default function Home() {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"free" | "day_access" | "standard" | "pro" | "premium" | "admin_premium">("free");
  const [dailyWordsUsed, setDailyWordsUsed] = useState(0);
  const [selectedModel, setSelectedModel] = useState("speakleash/bielik-11b-v3.0-instruct:q5_k_m");

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const translations = {
    pl: {
      noText: "Wpisz tekst!",
      currentRole: "Aktualna rola",
      logout: "Wyloguj",
      outputHeader: "Tekst wyjściowy",
      inputHeader: "Tekst wejściowy",
      placeholderInput: "Wpisz lub wklej tekst tutaj...",
      emptyOutput: "Tu pojawi się wynik...",
      copy: "Kopiuj",
      paste: "Wklej",
      clear: "Wyczyść",
      edit: "Edytuj",
      shorten: "Skróć",
      formalize: "Sformalizuj",
      translate: "Przetłumacz",
      research: "Uzupełnij",
      chars: "znaków",
      words: "słów",
    },
    en: {
      noText: "Enter some text!",
      currentRole: "Current role",
      logout: "Logout",
      outputHeader: "Output text",
      inputHeader: "Input text",
      placeholderInput: "Type or paste text here...",
      emptyOutput: "Result will appear here...",
      copy: "Copy",
      paste: "Paste",
      clear: "Clear",
      edit: "Edit",
      shorten: "Shorten",
      formalize: "Formalize",
      translate: "Translate",
      research: "Research",
      chars: "chars",
      words: "words",
    },
  };

  const t = (key: keyof typeof translations.pl) => translations[lang][key] || key;

  useEffect(() => {
    const savedRole = localStorage.getItem("app_role");
    if (savedRole && ["free", "day_access", "standard", "pro", "premium", "admin_premium"].includes(savedRole)) {
      setRole(savedRole as any);
    }
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  useEffect(() => { localStorage.setItem("selectedModel", selectedModel); }, [selectedModel]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const copyOutput = () => { if (output) navigator.clipboard.writeText(output); };
  const pasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text.trim());
    } catch (err) { console.error(err); }
  };

  async function handleAction(mode: Mode) {
    if (!input.trim()) { alert(t("noText")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input, model: selectedModel, role }),
      });
      const data = await res.json();
      setOutput(data.output || "Błąd");
    } catch (err) {
      setOutput("Błąd połączenia.");
    } finally {
      setLoading(false);
    }
  }

  const logoutAdmin = () => { localStorage.removeItem("app_role"); setRole("free"); };
  const getStats = (text: string) => ({ chars: text.length, words: text.trim().split(/\s+/).filter(Boolean).length });

  const inputStats = getStats(input);
  const outputStats = getStats(output);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-80 sm:pb-96 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">

        {/* Pasek planów dla klientów */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
          {["Free", "Day Access", "Standard", "Pro", "Premium"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r.toLowerCase().replace(" ", "_") as any)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
                role === r.toLowerCase().replace(" ", "_") 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105" 
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Flagi */}
        <div className="flex justify-center gap-10 mb-6">
          <button onClick={() => setLang("pl")} className={`text-5xl transition-all ${lang === "pl" ? "scale-125" : "opacity-60 hover:opacity-90"}`}>🇵🇱</button>
          <button onClick={() => setLang("en")} className={`text-5xl transition-all ${lang === "en" ? "scale-125" : "opacity-60 hover:opacity-90"}`}>🇬🇧</button>
        </div>

        <div className="text-center text-lg sm:text-xl font-bold text-yellow-400 mb-5">
          Aktualna rola: {role.toUpperCase().replace("_", " ")}
        </div>

        {/* Pola tekstowe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <div className="bg-gray-900/70 rounded-xl border border-gray-700 overflow-hidden shadow-xl flex flex-col max-h-[28vh] lg:max-h-[34vh]">
            <div className="bg-gray-800 px-5 py-3 font-semibold text-lg border-b border-gray-700 shrink-0">
              Tekst wyjściowy
            </div>
            <div className="flex-1 p-5 relative overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed pr-2">
                  {output || <span className="text-gray-500 italic">Tu pojawi się wynik...</span>}
                </div>
              )}
              {output && <button onClick={copyOutput} className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded text-sm">Kopiuj</button>}
            </div>
            <div className="bg-gray-800 px-5 py-2.5 text-xs text-gray-400 border-t border-gray-700 shrink-0">
              znaków: {outputStats.chars} | słów: {outputStats.words}
            </div>
          </div>

          <div className="bg-gray-900/70 rounded-xl border border-gray-700 overflow-hidden shadow-xl flex flex-col">
            <div className="bg-gray-800 px-5 py-3 font-semibold text-lg border-b border-gray-700 shrink-0">
              Tekst wejściowy
            </div>
            <div className="flex-1 p-5 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Wpisz lub wklej tekst tutaj..."
                className="w-full h-[340px] sm:h-[420px] bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none resize-none text-sm leading-relaxed caret-white border-none overflow-y-auto"
              />
              <button onClick={pasteInput} className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm">Wklej</button>
              <button onClick={() => setInput("")} className="absolute top-14 right-4 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm">Wyczyść</button>
            </div>
            <div className="bg-gray-800 px-5 py-2.5 text-xs text-gray-400 border-t border-gray-700 shrink-0">
              znaków: {inputStats.chars} | słów: {inputStats.words}
            </div>
          </div>
        </div>

        {/* Przyciski na dole */}
        <div className="flex flex-wrap justify-center gap-4 mt-12 mb-40">
          <button onClick={() => handleAction("edytuj")} disabled={loading} className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-xl shadow-lg transition disabled:opacity-50 min-w-[130px]">
            Edytuj
          </button>
          {(role === "day_access" || role === "standard" || role === "pro" || role === "premium" || role === "admin_premium") && (
            <button onClick={() => handleAction("skroc")} disabled={loading} className="px-8 py-4 bg-green-700 hover:bg-green-800 text-white font-medium rounded-xl shadow-lg transition disabled:opacity-50 min-w-[130px]">
              Skróć
            </button>
          )}
          {(role === "day_access" || role === "standard" || role === "pro" || role === "premium" || role === "admin_premium") && (
            <button onClick={() => handleAction("formalny")} disabled={loading} className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow-lg transition disabled:opacity-50 min-w-[130px]">
              Sformalizuj
            </button>
          )}
          {(role === "premium" || role === "admin_premium") && (
            <button onClick={() => handleAction("translate")} disabled={loading} className="px-8 py-4 bg-pink-700 hover:bg-pink-800 text-white font-medium rounded-xl shadow-lg transition disabled:opacity-50 min-w-[130px]">
              Przetłumacz
            </button>
          )}
          {role === "admin_premium" && (
            <button onClick={() => handleAction("research")} disabled={loading} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg transition disabled:opacity-50 min-w-[160px] flex items-center justify-center gap-2">
              <span>🔍</span> Uzupełnij
            </button>
          )}
        </div>
      </div>
    </div>
  );
}