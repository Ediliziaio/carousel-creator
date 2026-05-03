/**
 * Cloudflare Pages Function: proxy verso Cloudflare Workers AI per riscrivere
 * un testo (titolo, hook, body) generando 3 varianti.
 *
 * Free tier: ~10.000 richieste/giorno con Llama 3.1 8B Instruct.
 *
 * Setup richiesto su Cloudflare Pages → Settings → Environment variables:
 *   CLOUDFLARE_ACCOUNT_ID  (NON Plain text — Encrypted)
 *   CLOUDFLARE_AI_TOKEN    (Encrypted, API token con permission "Workers AI - Read")
 *
 * NOTA: env vars senza prefisso VITE_ sono SOLO server-side (questa Function),
 * non vengono mai esposte al browser.
 */

interface Env {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_TOKEN?: string;
}

interface RequestBody {
  text: string;
  mode: "rewrite" | "shorten" | "punchier" | "expand";
  context?: string; // tipo slide o template, es. "hook" / "cta"
}

const PROMPTS: Record<RequestBody["mode"], (text: string, ctx?: string) => string> = {
  rewrite: (t, ctx) =>
    `Riscrivi il seguente testo per un carosello social${ctx ? ` (slide ${ctx})` : ""} in italiano. Genera 3 versioni diverse, tutte con lo stesso significato ma con tono e parole diverse. Restituisci ESATTAMENTE 3 righe, una variante per riga, niente preamboli, niente numerazione.\n\nTesto originale: "${t}"`,
  shorten: (t, ctx) =>
    `Accorcia il seguente testo per un carosello social${ctx ? ` (slide ${ctx})` : ""}. Genera 3 versioni più brevi (max 60% della lunghezza originale) mantenendo il messaggio. Restituisci ESATTAMENTE 3 righe, una variante per riga, niente preamboli.\n\nTesto: "${t}"`,
  punchier: (t, ctx) =>
    `Rendi il seguente testo più diretto e punchy per un carosello social${ctx ? ` (slide ${ctx})` : ""}. Genera 3 versioni con un hook più forte (prima parola più potente, frase più corta, no parole di riempimento). Restituisci ESATTAMENTE 3 righe, una variante per riga.\n\nTesto: "${t}"`,
  expand: (t, ctx) =>
    `Espandi il seguente testo aggiungendo dettaglio concreto (numeri, esempi specifici) senza diventare prolisso. Per slide social${ctx ? ` (${ctx})` : ""}. Genera 3 versioni espanse, una per riga, max 2 frasi ciascuna.\n\nTesto: "${t}"`,
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_AI_TOKEN) {
    return jsonError(500, "AI non configurata. Imposta CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_AI_TOKEN su Cloudflare Pages → Environment variables.");
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError(400, "Body JSON non valido");
  }
  const { text, mode = "rewrite", context } = body;
  if (!text || typeof text !== "string" || text.length > 600) {
    return jsonError(400, "Testo mancante o troppo lungo (max 600 caratteri).");
  }
  if (!(mode in PROMPTS)) return jsonError(400, "Mode non riconosciuto");

  const prompt = PROMPTS[mode](text, context);

  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
  const aiRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_AI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "Sei un copywriter social per caroselli Instagram/LinkedIn in italiano. Risposte brevi, dirette, no buzzword, no emoji. Quando l'utente chiede 3 varianti, rispondi con esattamente 3 righe.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.8,
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    return jsonError(aiRes.status, `Cloudflare AI error: ${txt.slice(0, 200)}`);
  }

  const data = (await aiRes.json()) as {
    result?: { response?: string };
    success?: boolean;
    errors?: { message: string }[];
  };
  if (!data.success || !data.result?.response) {
    return jsonError(500, data.errors?.[0]?.message ?? "Risposta AI vuota");
  }

  // Spezza la risposta in righe non vuote, max 3.
  const variants = data.result.response
    .split("\n")
    .map((l) => l.replace(/^[\d.)\-*•]+\s*/, "").trim())
    .filter((l) => l.length > 0 && l.length < 400)
    .slice(0, 3);

  return new Response(JSON.stringify({ variants }), {
    headers: { "Content-Type": "application/json" },
  });
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
