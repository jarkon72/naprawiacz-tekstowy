"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("app_role", "admin_premium");
        alert("Zalogowano jako Admin Premium!");
        window.location.href = "/";
      } else {
        setError(data.error || "Błędne hasło");
      }
    } catch (err) {
      setError("Błąd połączenia z serwerem");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Logowanie Admin Premium
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wprowadź hasło"
            disabled={loading}
            className="w-full p-4 mb-6 bg-gray-900 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
            autoComplete="off"
            autoFocus
          />

          {error && (
            <p className="text-red-500 mb-6 text-center font-medium">{error}</p>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              {loading ? "Sprawdzanie..." : "Zaloguj"}
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="flex-1 py-3 px-6 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}