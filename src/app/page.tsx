"use client";

export default function Home() {
<<<<<<< HEAD
  return (
    <div style={{
      height: "100vh",
      background: "black",
      color: "red",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "40px",
      fontWeight: "bold"
    }}>
      TEST 123 — NOWY BUILD
=======
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("speakleash/bielik-11b-v3.0-instruct:q5_k_m");
  const [role, setRole] = useState<"free" | "pro" | "premium" | "admin_premium">("free");
  const [dailyWordsUsed, setDailyWordsUsed] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  console.log("Aktualna rola:", role);

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
    const en = { ...pl }; // uproszczone, możesz później uzupełnić
    return lang === "pl" ? pl[key as keyof typeof pl] : en[key as keyof typeof en];
  };

  const limits = {
    free: 1500,
    pro: 10000,
    premium: 50000,
    admin_premium: Infinity,
  };

  // --- Szybki przycisk Admin bez hasła ---
  const enterAsAdmin = () => {
    setRole("admin_premium");
    alert("Jesteś teraz w trybie Admin Premium – wszystkie funkcje odblokowane.");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("dailyWordsUsed");
    const today = new Date().toDateString();
    if (saved) {
      try {
        const { date, count } = JSON.parse(saved);
        setDailyWordsUsed(date === today ? count : 0);
      } catch {
        setDailyWordsUsed(0);
      }
    }
  }, []);

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
      setDailyWordsUsed(prev => prev + wordCount);
    } catch (err: any) {
      console.error("Błąd:", err);
      setOutput("Błąd przetwarzania: " + (err.message || "Connection error"));
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    alert("Skopiowano!");
  };

  const pasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      alert("Nie udało się wkleić");
    }
  };

  const getStats = (text: string) => ({
    chars: text.length,
    words: text.trim().split(/\s+/).filter(Boolean).length,
  });

  const inputStats = getStats(input);
  const outputStats = getStats(output);

  const canShorten = role !== "free";
  const canFormal = role !== "free";
  const canTranslate = role === "premium" || role === "admin_premium";

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">{t("title")}</h1>
      </div>

      {/* Szybki przycisk Admin bez hasła */}
      <div className="flex justify-center mt-4">
        <button
          onClick={enterAsAdmin}
          className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg text-lg shadow-lg"
        >
          Wejdź jako Admin (bez hasła)
        </button>
      </div>

      <div className="text-center mt-3 text-lg font-bold text-yellow-400">
        Aktualna rola: {role.toUpperCase()}
      </div>

      <div className="editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel" style={{ height: "100%" }}>
          <div className="panel-header">{t("output")}</div>
          <div className="textarea-wrapper">
            <div className="textarea whitespace-pre-wrap overflow-y-auto h-full p-4">
              {loading ? "Przetwarzam..." : output || "Tu pojawi się wynik"}
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
              placeholder="Wpisz lub wklej tekst tutaj..."
              className="textarea"
            />
            <button onClick={pasteInput} className="paste-btn">{t("paste")}</button>
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
>>>>>>> 83d29340505198f401c47830019c9e5709c51ba8
    </div>
  );
}