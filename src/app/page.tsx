"use client";
import { useEffect, useState } from "react";

type Mode = "edytuj" | "skroc" | "formalny" | "tlumacz" | "research";
type Role = "free" | "day" | "standard" | "pro" | "premium" | "admin_premium";

const MODEL_OPTIONS: Record<Role, { value: string; label: string; tag: string; tagColor: string }[]> = {
  free: [
    { value: "speakleash/bielik-11b-v3.0-instruct:q4_K_M", label: "Bielik 11B", tag: "POLSKI", tagColor: "#b45309" },
  ],
  day: [
    { value: "speakleash/bielik-11b-v3.0-instruct:q4_K_M", label: "Bielik 11B", tag: "POLSKI", tagColor: "#b45309" },
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "SZYBKI", tagColor: "#0f766e" },
  ],
  standard: [
    { value: "speakleash/bielik-11b-v3.0-instruct:q4_K_M", label: "Bielik 11B", tag: "POLSKI", tagColor: "#b45309" },
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "SZYBKI", tagColor: "#0f766e" },
  ],
  pro: [
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "EDYCJA", tagColor: "#1d4ed8" },
    { value: "qwen2.5:14b", label: "Qwen 2.5 14B", tag: "GENEROWANIE", tagColor: "#7c3aed" },
  ],
  premium: [
    { value: "speakleash/bielik-11b-v3.0-instruct:q4_K_M", label: "Bielik 11B", tag: "POLSKI", tagColor: "#b45309" },
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "EDYCJA", tagColor: "#1d4ed8" },
    { value: "qwen2.5:14b", label: "Qwen 2.5 14B", tag: "GENEROWANIE", tagColor: "#7c3aed" },
  ],
  admin_premium: [
    { value: "speakleash/bielik-11b-v3.0-instruct:q4_K_M", label: "Bielik 11B", tag: "POLSKI", tagColor: "#b45309" },
    { value: "trurl-13b-q6:latest", label: "Trurl 13B", tag: "EDYCJA", tagColor: "#1d4ed8" },
    { value: "qwen2.5:latest", label: "Qwen 2.5", tag: "SZYBKI", tagColor: "#0f766e" },
    { value: "qwen2.5:14b", label: "Qwen 14B", tag: "GENEROWANIE", tagColor: "#7c3aed" },
  ],
};

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("standard");
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Aktualizacja modelu przy zmianie roli
  useEffect(() => {
    const models = MODEL_OPTIONS[role];
    if (models && models.length > 0) {
      setSelectedModel(models[0].value);
    }
  }, [role]);

  // Ustawienie początkowego modelu
  useEffect(() => {
    const models = MODEL_OPTIONS[role];
    if (models && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].value);
    }
  }, []);

  async function handleAction(mode: Mode) {
    if (!input.trim()) {
      alert("Wpisz tekst!");
      return;
    }

    console.log("=== KLIKNIĘTO EDYTUJ ===", { mode, selectedModel, textLength: input.length });

    setLoading(true);
    setOutput("Przetwarzam...");

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: input, model: selectedModel }),
      });

      const data = await res.json();
      console.log("Odpowiedź z API:", data);

      if (data.error) {
        setOutput(`Błąd: ${data.error}`);
      } else {
        setOutput(data.output || "Brak wyniku z modelu.");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setOutput("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  const copyOutput = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  const currentModels = MODEL_OPTIONS[role];

  return (
    <div className="app-container">

      <div className="header">
        <h1 className="title">Poprawiacz tekstu v2</h1>
      </div>

      {/* PLAN BUTTONS */}
      <div className="flex justify-center gap-2 mt-3 flex-wrap">
        {(["free", "day", "standard", "pro", "premium"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`btn ${role === r ? "opacity-100" : "opacity-60"}`}
          >
            {r === "free" ? "Darmowy" : r === "day" ? "Dzień" : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* MODEL SELECTOR */}
      <div className="model-panel">
        <div className="model-panel-header">
          <span className="model-panel-label">MODEL</span>
        </div>
        <div className="model-options">
          {currentModels.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedModel(m.value)}
              className={`model-chip ${selectedModel === m.value ? "model-chip-active" : ""}`}
            >
              {m.label} <span className="model-chip-tag" style={{ background: m.tagColor }}>{m.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* EDITOR GRID */}
      <div className="editor-grid">

        <div className="panel">
          <div className="panel-header">TEKST WYJŚCIOWY</div>
          <div className="textarea-wrapper">
            <div className="output-content">
              {loading ? "Przetwarzam..." : output || "Tu pojawi się wynik"}
            </div>
            {output && !loading && (
              <button onClick={copyOutput} className="copy-btn">Kopiuj</button>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">TEKST WEJŚCIOWY</div>
          <div className="textarea-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="textarea"
              placeholder="Wklej tekst tutaj..."
            />
          </div>
        </div>

      </div>

      {/* ACTIONS */}
      <div className="actions">
        <button onClick={() => handleAction("edytuj")} className="btn btn-edytuj" disabled={loading}>
          {loading ? "Przetwarzam..." : "Edytuj"}
        </button>
        <button onClick={() => handleAction("skroc")} className="btn btn-skroc" disabled={loading}>
          Skróć
        </button>
        <button onClick={() => handleAction("formalny")} className="btn btn-formalny" disabled={loading}>
          Sformalizuj
        </button>
        <button onClick={() => handleAction("tlumacz")} className="btn btn-translate" disabled={loading}>
          Przetłumacz
        </button>
      </div>

    </div>
  );
}