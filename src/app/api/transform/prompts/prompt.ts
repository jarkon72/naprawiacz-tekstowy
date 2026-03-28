// src/app/api/transform/prompts/prompt.ts

export function getPrompt(
  mode: "edytuj" | "skroc" | "formalny" | "translate" | "research",
  text: string
): string {

  const common = `Jesteś precyzyjnym edytorem tekstu.
Zwracaj TYLKO finalny tekst.
Bez komentarzy, bez wyjaśnień, bez wstępów typu "Oto poprawiona wersja".`;

  switch (mode) {

    case "edytuj":
      return `${common}

Popraw błędy gramatyczne, stylistyczne, interpunkcyjne i logiczne w tym tekście.
Nie zmieniaj sensu autora.

Tekst:
${text}

Zwróć tylko poprawioną wersję.`;

    case "skroc":
      return `${common}

Skróć ten tekst do około 40–60% długości.
Zachowaj główne idee i sens autora.

Tekst:
${text}

Zwróć tylko skróconą wersję.`;

    case "formalny":
      return `${common}

Przeredaguj tekst na bardziej formalny i profesjonalny styl.
Usuń kolokwializmy i uproszczenia językowe.

Tekst:
${text}

Zwróć tylko sformalizowaną wersję.`;

    case "translate":
      return `${common}

Przetłumacz tekst:
- z polskiego na angielski
- lub z angielskiego na polski

Zachowaj sens i styl oryginału.

Tekst:
${text}

Zwróć tylko tłumaczenie.`;

    case "research":
      return `${common}

Twoim zadaniem jest uzupełnienie tekstu autora o brakujące fakty, kontekst i informacje,
ALE BEZ SKRACANIA.

ZASADY:
1. Zachowaj oryginalny tekst i jego strukturę.
2. Nie usuwaj treści.
3. Nie streszczaj.
4. Nie skracaj.
5. Dodawaj informacje bezpośrednio w zdaniach lub jako naturalne rozszerzenia.
6. Możesz lekko rozbudować zdania, jeśli to poprawia klarowność.
7. Wynik musi być TAK SAM DŁUGI lub DŁUŻSZY niż wejście.

Tekst autora:
${text}

Zwróć pełny tekst z uzupełnieniami.`;

    default:
      return text;
  }
}