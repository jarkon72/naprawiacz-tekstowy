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

Twoim zadaniem jest DELIKATNE uzupełnienie tekstu autora o fakty historyczne,
nazwy instytucji, daty lub wydarzenia, które naturalnie pasują do treści.

ZASADY:
1.Popraw błędy gramatyczne, stylistyczne, interpunkcyjne i logiczne w tym tekście.
Nie zmieniaj sensu autora.
2. Nie zmieniaj stylu autora.
3. Nie pisz nowego artykułu.
4. Nie rozwijaj nowych wątków.
5. Dodawaj tylko krótkie fakty tam, gdzie pasują.
6. Zachowaj strukturę i ton tekstu.
7. Jeśli fakt nie jest bezpośrednio związany z tekstem – pomiń go.

Tekst autora:
${text}

Zwróć tylko poprawiony tekst z ewentualnymi uzupełnieniami.`;

    default:
      return text;
  }
}