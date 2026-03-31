// src/app/api/transform/prompts/prompt.ts

export function getPrompt(
  mode: "edytuj" | "skroc" | "formalny" | "translate" | "research",
  text: string,
  onlineContext?: string
): string {

  const fence = "===TEXT===";

  switch (mode) {

    // ─── FREE / DAY / STANDARD / PRO / PREMIUM / ADMIN ──────────────────────
    case "edytuj":
      return `You are a precise Polish text editor. Your only job is to fix errors and return the corrected text.

STRICT RULES:
- Fix ALL spelling, grammar, punctuation, and stylistic errors in the text below.
- Do NOT change the author's meaning, tone, or sentence structure unless it is grammatically broken.
- Do NOT add new content, summaries, or commentary.
- Do NOT write any introduction like "Here is the corrected text:" — return ONLY the fixed text.
- If a sentence is already correct, leave it exactly as is.
- Output must be in the same language as input.

${fence}
${text}
${fence}

Return only the corrected text. Nothing else.`;

    // ─── DAY / STANDARD / PRO / PREMIUM / ADMIN ─────────────────────────────
    case "skroc":
      return `You are a precise text editor. Your only job is to shorten the text and return it.

STRICT RULES:
- Shorten the text to approximately 50% of its original length.
- Keep the most important ideas and the author's core message.
- Do NOT add new content.
- Do NOT write any introduction — return ONLY the shortened text.
- Preserve the original language (Polish or English).
- Do not use bullet points unless the original used them.

${fence}
${text}
${fence}

Return only the shortened text. Nothing else.`;

    // ─── STANDARD / PRO / PREMIUM / ADMIN ───────────────────────────────────
    case "formalny":
      return `You are a professional language editor. Your only job is to rewrite the text in a formal, professional register and return it.

STRICT RULES:
- Rewrite the text in a formal, professional style suitable for business or academic use.
- Remove all colloquialisms, slang, informal expressions, and contractions.
- Do NOT change the meaning or omit content.
- Do NOT add new content, summaries, or commentary.
- Do NOT write any introduction — return ONLY the rewritten text.
- Preserve the original language (Polish or English).
- Maintain the same paragraph structure as the original.

${fence}
${text}
${fence}

Return only the formalized text. Nothing else.`;

    // ─── PREMIUM / ADMIN ─────────────────────────────────────────────────────
    case "translate":
      return `You are a professional translator. Your only job is to translate the text and return it.

STRICT RULES:
- Detect the language of the input text automatically.
- If it is Polish → translate to English.
- If it is English → translate to Polish.
- Preserve the author's tone, style, and meaning precisely.
- Do NOT summarize, shorten, or add content.
- Do NOT write any introduction — return ONLY the translation.
- Preserve paragraph structure.

${fence}
${text}
${fence}

Return only the translated text. Nothing else.`;

    // ─── ADMIN ONLY ──────────────────────────────────────────────────────────
    case "research": {
      const safeText = text.trim();
      const contextBlock = onlineContext
        ? `VERIFIED FACTS FROM THE WEB (use these to enrich the text):\n${onlineContext}\n\n`
        : "";

      return `You are a professional Polish editor, ghostwriter, and researcher. \
Your job is to enrich and complete the author's text by adding missing facts, \
context, and details — written entirely in the author's own voice and style.

STRICT RULES:
1. READ the author's text carefully. Identify their writing style: sentence length, \
vocabulary level, tone (formal/informal/journalistic/literary), and rhythm.
2. KEEP every sentence the original author wrote. Do NOT delete, shorten, or rephrase \
their words unless there is a clear grammatical error.
3. ADD missing facts, dates, names, numbers, causes, consequences, or context — \
but write them as if the author wrote them. Match their voice exactly.
4. EXPAND naturally: insert new sentences or clauses directly where the gap exists \
in the original flow. Do not append a block of new text at the end.
5. If web facts are provided below, use them. If not, use your own knowledge. \
Never invent facts — only add what is verifiably true.
6. The output MUST be longer than the input. If the input is 100 words, output at least 150.
7. Do NOT write any introduction, meta-comment, or explanation — return ONLY the enriched text.
8. Preserve the original language (Polish or English).

${contextBlock}${fence}
${safeText}
${fence}

Return only the enriched text written in the author's voice. Nothing else.`;
    }
  }
}
