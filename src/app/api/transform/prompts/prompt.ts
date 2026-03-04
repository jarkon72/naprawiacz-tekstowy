// src/app/api/transform/prompts/prompt.ts

export function getPrompt(mode: "edytuj" | "skroc" | "formalny" | "translate", text: string): string {
  const common = `Jesteś precyzyjnym edytorem tekstu. Zwracaj TYLKO poprawiony tekst. Bez komentarzy, bez wyjaśnień, bez wstępów typu "Oto poprawiona wersja".`;

  switch (mode) {
    case "edytuj":
      return `${common}\n\nPopraw błędy gramatyczne, stylistyczne, interpunkcyjne i logiczne w tym tekście:\n\n${text}\n\nZwróć tylko poprawioną wersję.`;

    case "skroc":
      return `${common}\n\nSkróć ten tekst do 40–60% oryginalnej długości, zachowując najważniejsze informacje i sens:\n\n${text}\n\nZwróć tylko skróconą wersję.`;

    case "formalny":
      return `${common}\n\nPrzeredaguj ten tekst na bardziej formalny, profesjonalny język (bez kolokwializmów, slangów, z poprawną gramatyką i strukturą):\n\n${text}\n\nZwróć tylko sformalizowaną wersję.`;

    case "translate":
      return `${common}\n\nPrzetłumacz ten tekst z polskiego na angielski (lub z angielskiego na polski, jeśli tekst jest po angielsku). Zachowaj sens i styl oryginału:\n\n${text}\n\nZwróć tylko tłumaczenie.`;

    default:
      return text;
  }
}