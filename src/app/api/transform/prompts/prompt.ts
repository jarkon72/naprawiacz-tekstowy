// src/app/api/transform/prompts/prompt.ts
export function getPrompt(
  mode: "edytuj" | "skroc" | "formalny" | "translate" | "tlumacz" | "research",
  text: string,
  onlineContext?: string
): string {
  switch (mode) {

    case "edytuj":
      return `Jesteś korektorem tekstu. Popraw TYLKO błędy ortograficzne, gramatyczne i interpunkcyjne w poniższym tekście.

Zrób:
- popraw błędy językowe i interpunkcję
- usuń powtórzenia i zbędne słowa
- skracaj zdania i popraw ich rytm
- zastępuj słabe, sztuczne lub abstrakcyjne fragmenty lepszymi i bardziej naturalnymi
- popraw miejsca, które brzmią nienaturalnie
- usuwaj powtórzenia tego samego słowa w jednym zdaniu lub obok siebie

Zachowaj:
- sens, ton i wszystkie informacje
- konkret i obrazowość

Nie rób:
- nie dodawaj nowych treści ani interpretacji
- nie rozbudowuj tekstu
- nie zmieniaj znaczenia tekstu
- nie zamieniaj konkretów na ogólniki
- nie używaj żadnych znaków specjalnych ani wyróżnień

Zwróć WYŁĄCZNIE poprawiony tekst. Bez komentarzy, bez nagłówków, bez wyjaśnień.

TEKST DO KOREKTY:
${text}`.trim();

    case "skroc":
      return `Jesteś redaktorem. Skróć poniższy tekst do około 15% jego długości, zachowując najważniejsze informacje i styl autora. Zwróć TYLKO skrócony tekst, bez komentarzy.

TEKST:
${text}`.trim();

    case "formalny":
      return `Jesteś redaktorem języka polskiego. Przepisz poniższy tekst w formalnym, profesjonalnym stylu odpowiednim dla dokumentów biznesowych lub akademickich. Usuń kolokwializmy i nieformalny język. Nie zmieniaj sensu. Zwróć TYLKO przepisany tekst, bez komentarzy.

TEKST:
${text}`.trim();

    case "translate":
    case "tlumacz":
      return `Jesteś tłumaczem. Przetłumacz poniższy tekst: jeśli jest po polsku — przetłumacz na angielski; jeśli jest po angielsku — przetłumacz na polski. Zachowaj styl i ton autora. Zwróć TYLKO przetłumaczony tekst, bez komentarzy.

TEKST:
${text}`.trim();

    case "research": {
      const safeText = text.trim();
      const contextBlock = onlineContext
        ? `Zweryfikowane fakty z internetu (użyj ich do wzbogacenia tekstu):\n${onlineContext}\n\n`
        : "";
      return `Jesteś polskim redaktorem, ghostwriterem i badaczem. Wzbogać poniższy tekst, dodając brakujące fakty, kontekst i szczegóły — pisząc w stylu i głosem autora.

ZASADY:
1. Zachowaj każde zdanie autora w niezmienionej formie.
2. Dodaj brakujące fakty, daty, nazwiska, liczby, przyczyny i konsekwencje — pisząc jak autor.
3. Wstawiaj nowe zdania naturalnie w miejscach, gdzie brakuje informacji.
4. Wynik MUSI być dłuższy niż oryginał.
5. Zwróć TYLKO wzbogacony tekst, bez komentarzy i wstępów.

${contextBlock}TEKST:
${safeText}`.trim();
    }

    default:
      throw new Error(`Nieobsługiwany tryb: ${mode}`);
  }
}
