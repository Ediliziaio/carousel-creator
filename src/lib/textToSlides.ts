import type { TemplateId, AnyTemplateData } from "./templates";
import { makeDefaultData } from "./templates";
import type { ImportedItem, ImportResult } from "./contentImport";

/**
 * Trasforma un testo libero (stile markdown light) in una sequenza di slide
 * impaginate automaticamente. Pensato per buttarci dentro un brief, un articolo
 * o uno script di carosello e ottenere subito 5-10 slide pronte da raffinare.
 *
 * Pattern riconosciuti:
 *   # Titolo carosello              → slide 1: cover
 *   ## Nuova slide                   → ogni H2 (o riga in MAIUSCOLO breve) apre una nuova slide
 *   - punto / • punto / 1. punto    → lista → template `checklist`
 *   "73%" / "+250" / "3x" da solo   → numero prominente → template `bignum`
 *   CTA / Conclusione / Iscriviti   → ultima slide → template `cta`
 *   testo normale                   → template `center` (titolo + body)
 *
 * NOTE: parser euristico, non perfetto. Per testi complessi serve LLM.
 * L'utente deve poter raffinare ogni slide dopo l'import.
 */

interface Section {
  heading: string | null;
  body: string[];
}

const CTA_KEYWORDS = [
  "cta",
  "call to action",
  "conclusione",
  "scopri di più",
  "iscriviti",
  "contattaci",
  "richiedi",
  "prenota",
  "scarica",
];

export function parseTextToSlides(input: string): ImportResult {
  const errors: string[] = [];
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) {
    return { items: [], errors: ["Testo vuoto."] };
  }

  // 1) Spezza in sezioni usando heading markdown OR linee MAIUSCOLE brevi.
  const sections = splitIntoSections(text);
  if (sections.length === 0) {
    return { items: [], errors: ["Nessuna sezione riconoscibile."] };
  }

  // 2) Per ogni sezione, sceglie il template e popola i campi.
  const items: ImportedItem[] = [];
  sections.forEach((sec, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === sections.length - 1;
    const item = sectionToSlide(sec, { isFirst, isLast });
    if (item) items.push(item);
  });

  if (items.length === 0) {
    return { items: [], errors: ["Nessuna slide generata dal testo."] };
  }
  return { items, errors };
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section = { heading: null, body: [] };

  const pushCurrent = () => {
    const hasContent =
      (current.heading && current.heading.length > 0) || current.body.some((l) => l.trim());
    if (hasContent) sections.push(current);
  };

  for (const raw of lines) {
    const line = raw.trim();
    // Linea vuota: ignora ma non chiude la sezione (i paragrafi multi-line restano insieme).
    if (!line) {
      current.body.push("");
      continue;
    }
    // Heading markdown.
    const md = /^(#{1,6})\s+(.*)$/.exec(line);
    if (md) {
      pushCurrent();
      current = { heading: md[2].trim(), body: [] };
      continue;
    }
    // Linea breve TUTTA MAIUSCOLA seguita da contenuto → heading implicito.
    if (line.length <= 60 && line === line.toUpperCase() && /[A-ZÀÈÉÌÒÙ]/.test(line)) {
      pushCurrent();
      current = { heading: titleCase(line), body: [] };
      continue;
    }
    current.body.push(line);
  }
  pushCurrent();

  // Riempie heading mancante usando la prima frase del body se la sezione non ha heading.
  return sections.map((s) => {
    if (s.heading) return s;
    const firstNonEmpty = s.body.find((l) => l.trim());
    if (!firstNonEmpty) return s;
    const sentence = firstNonEmpty.split(/(?<=[.!?])\s+/)[0];
    return {
      heading: sentence.length <= 80 ? sentence : sentence.slice(0, 77) + "…",
      body: s.body,
    };
  });
}

interface ContextFlags {
  isFirst: boolean;
  isLast: boolean;
}

function sectionToSlide(sec: Section, ctx: ContextFlags): ImportedItem | null {
  const heading = (sec.heading ?? "").trim();
  const bodyLines = sec.body.filter((l) => l.trim());
  const bodyText = bodyLines.join("\n").trim();
  if (!heading && !bodyText) return null;

  const warnings: string[] = [];

  // CTA: keyword nel heading, o ultima slide con call-to-action evidente.
  const headLower = heading.toLowerCase();
  const isCtaSection = CTA_KEYWORDS.some((k) => headLower.includes(k));
  if (isCtaSection || (ctx.isLast && bodyText.length < 200 && /[\.!]\s*$/.test(bodyText))) {
    return makeSlide(
      "cta",
      {
        eyebrow: "Pronti a iniziare?",
        headline: heading || "Inizia adesso",
        subtitle: firstSentence(bodyText) || "Scopri di più sul nostro sito.",
        buttonLabel: pickCtaLabel(heading, bodyText),
      },
      warnings,
    );
  }

  // Testimonial: blocco con citazione (riga tra virgolette o iniziando con > )
  // e una riga "— Autore" o "- Autore".
  const testimonial = extractTestimonial(bodyLines);
  if (testimonial) {
    return makeSlide(
      "testimonial",
      {
        quote: testimonial.quote,
        author: testimonial.author,
        role: testimonial.role,
      },
      warnings,
    );
  }

  // Pro/Contro: due blocchi etichettati Pro: e Contro: (o "+" e "-").
  const prosCons = extractProsCons(bodyLines);
  if (prosCons) {
    return makeSlide(
      "prosCons",
      {
        title: heading || "Pro & Contro",
        pros: prosCons.pros,
        cons: prosCons.cons,
      },
      warnings,
    );
  }

  // Problema → Soluzione: linee "Problema: ..." e "Soluzione: ...".
  const ps = extractProblemSolution(bodyLines, heading);
  if (ps) {
    return makeSlide(
      "problemSolution",
      {
        eyebrow: heading || "Problema → Soluzione",
        problem: { label: "IL PROBLEMA", text: ps.problem },
        solution: { label: "LA SOLUZIONE", text: ps.solution },
      },
      warnings,
    );
  }

  // Poll: heading o body con "?" e 2-4 linee bullet che terminano con percentuale (es. "Sì 62%").
  const poll = extractPoll(bodyLines, heading);
  if (poll) {
    return makeSlide(
      "poll",
      {
        eyebrow: "SONDAGGIO",
        question: poll.question,
        options: poll.options,
      },
      warnings,
    );
  }

  // FAQ: alternanza domanda → risposta (Q: / A: o ? finale).
  const faqItems = extractFaqItems(bodyLines);
  if (faqItems.length >= 2) {
    return makeSlide(
      "faq",
      {
        title: heading || "Domande frequenti",
        items: faqItems.slice(0, 6),
      },
      warnings,
    );
  }

  // Lista: 2+ linee bullet → checklist con items[].title.
  const bulletItems = extractBulletItems(bodyLines);
  if (bulletItems.length >= 2) {
    return makeSlide(
      "checklist",
      {
        title: heading || "Punti chiave",
        items: bulletItems.slice(0, 6).map((t) => ({ title: t })),
      },
      warnings,
    );
  }

  // Numero prominente (es. "73%", "+250", "3x", "1M+") sulla prima riga.
  const numMatch = bodyLines[0]?.match(/^([+\-]?\d+[.,]?\d*\s*(%|x|X|k|K|M|m|€|\$)?)\s*(.*)$/);
  if (numMatch && numMatch[1].length <= 10 && numMatch[3].length < 80) {
    const restAfterNumber = numMatch[3].trim();
    const subTitle = restAfterNumber || heading || "";
    const paragraphs = bodyLines
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean);
    return makeSlide(
      "bignum",
      {
        number: numMatch[1].trim(),
        numberSub: subTitle,
        title: heading || "",
        paragraphs: paragraphs.length > 0 ? paragraphs : undefined,
      },
      warnings,
    );
  }

  // Cover (prima slide): eyebrow piccolo + titolo grosso + sottotitolo.
  if (ctx.isFirst) {
    return makeSlide(
      "cover",
      {
        eyebrow: "Carosello",
        title: heading,
        sub: firstSentence(bodyText),
      },
      warnings,
    );
  }

  // Default: center (titolo + body) — il template usa `sub` per il body.
  return makeSlide(
    "center",
    {
      title: heading,
      sub: bodyText,
    },
    warnings,
  );
}

function makeSlide(
  template: TemplateId,
  data: Record<string, unknown>,
  warnings: string[],
): ImportedItem {
  const base = makeDefaultData(template) as unknown as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (k in base) merged[k] = v;
    else warnings.push(`Campo "${k}" non disponibile sul template ${template}: ignorato.`);
  }
  return { template, data: merged as unknown as AnyTemplateData, warnings };
}

function extractTestimonial(
  lines: string[],
): { quote: string; author: string; role: string } | null {
  if (lines.length < 2) return null;
  // Cerca una riga citazione (tra virgolette o con `>`) e una riga `— Autore`.
  let quote: string | null = null;
  let authorLine: string | null = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (!quote) {
      const q = /^[>"«„]\s*(.+?)["»"]?$/.exec(l) || /^"(.+?)"$/.exec(l);
      if (q) quote = q[1].trim();
      continue;
    }
    if (/^[—–-]\s*\S+/.test(l)) {
      authorLine = l.replace(/^[—–-]\s*/, "").trim();
      break;
    }
  }
  if (!quote || !authorLine) return null;
  const [author, role] = authorLine.split(/\s*[,·|]\s*/);
  return { quote, author: author.trim(), role: (role ?? "").trim() };
}

function extractProsCons(lines: string[]): { pros: string[]; cons: string[] } | null {
  const pros: string[] = [];
  const cons: string[] = [];
  let mode: "pros" | "cons" | null = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (/^(pro|pros|vantaggi)\s*:?$/i.test(l)) {
      mode = "pros";
      continue;
    }
    if (/^(contro|cons|svantaggi)\s*:?$/i.test(l)) {
      mode = "cons";
      continue;
    }
    if (l.startsWith("+ ")) {
      pros.push(l.slice(2).trim());
      continue;
    }
    if (l.startsWith("- ") && mode === "cons") {
      cons.push(l.slice(2).trim());
      continue;
    }
    const m = /^[-*•]\s+(.+)$/.exec(l);
    if (m && mode) (mode === "pros" ? pros : cons).push(m[1].trim());
  }
  if (pros.length >= 2 && cons.length >= 2) return { pros, cons };
  return null;
}

function extractProblemSolution(
  lines: string[],
  heading: string,
): { problem: string; solution: string } | null {
  const text = lines.join(" ");
  const probMatch = /(?:problema|pain|dolore)\s*[:\-]\s*([^\n]+?)(?=\s*(?:soluzione|fix|risposta)\s*[:\-]|$)/i.exec(
    text,
  );
  const solMatch = /(?:soluzione|fix|risposta)\s*[:\-]\s*(.+)$/i.exec(text);
  if (probMatch && solMatch) {
    return { problem: probMatch[1].trim(), solution: solMatch[1].trim() };
  }
  // Caso: due linee chiare "Problema:" e "Soluzione:" su righe separate.
  const p = lines.find((l) => /^problema\s*:/i.test(l));
  const s = lines.find((l) => /^soluzione\s*:/i.test(l));
  if (p && s) {
    return {
      problem: p.replace(/^problema\s*:/i, "").trim(),
      solution: s.replace(/^soluzione\s*:/i, "").trim(),
    };
  }
  // Heading "Problema → Soluzione" + corpo single-line con freccia.
  if (/(problema|pain).*?(soluzione|fix)/i.test(heading)) {
    const arrow = /(.+?)\s*(?:→|->|⇒)\s*(.+)/.exec(text);
    if (arrow) return { problem: arrow[1].trim(), solution: arrow[2].trim() };
  }
  return null;
}

function extractPoll(
  lines: string[],
  heading: string,
): {
  question: string;
  options: { label: string; percentage?: number; leading?: boolean }[];
} | null {
  // Domanda: heading se finisce con "?" o prima riga del body con "?".
  let question = "";
  if (heading.endsWith("?")) question = heading;
  else {
    const firstQ = lines.find((l) => l.trim().endsWith("?"));
    if (firstQ) question = firstQ.trim();
  }
  if (!question) return null;

  // Opzioni: linee bullet con percentuale tipo "- Sì 62%" o "1. No 38%".
  const options: { label: string; percentage?: number; leading?: boolean }[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    const m = /^(?:[-*•]|\d+[.)])\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*%\s*$/.exec(l);
    if (m) {
      options.push({ label: m[1].trim(), percentage: parseFloat(m[2].replace(",", ".")) });
    }
  }
  if (options.length < 2) return null;

  // Marca come leading l'opzione con la percentuale più alta.
  const maxPct = Math.max(...options.map((o) => o.percentage ?? 0));
  options.forEach((o) => {
    if ((o.percentage ?? 0) === maxPct && maxPct > 0) o.leading = true;
  });
  return { question, options: options.slice(0, 4) };
}

function extractFaqItems(lines: string[]): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];
  let pendingQ: string | null = null;
  for (const raw of lines) {
    const l = raw.trim();
    const qMatch = /^(?:Q\s*[:\-]|D\s*[:\-]|domanda\s*[:\-])\s*(.+)$/i.exec(l) ||
      (l.endsWith("?") ? [l, l] : null);
    const aMatch = /^(?:A\s*[:\-]|R\s*[:\-]|risposta\s*[:\-])\s*(.+)$/i.exec(l);
    if (qMatch) {
      pendingQ = qMatch[1].trim();
      continue;
    }
    if (aMatch && pendingQ) {
      items.push({ q: pendingQ, a: aMatch[1].trim() });
      pendingQ = null;
      continue;
    }
    if (pendingQ && l.length > 0) {
      // riga di risposta non prefissata
      items.push({ q: pendingQ, a: l });
      pendingQ = null;
    }
  }
  return items;
}

function extractBulletItems(lines: string[]): string[] {
  const items: string[] = [];
  for (const l of lines) {
    const t = l.trim();
    const m = /^(?:[-*•]|\d+[.)])\s+(.+)$/.exec(t);
    if (m) items.push(m[1].trim());
  }
  return items;
}

function firstSentence(s: string): string {
  if (!s) return "";
  const m = s.split(/(?<=[.!?])\s+/);
  return (m[0] ?? "").trim();
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Prompt da incollare come "Custom instructions" di un Claude Project (o GPT)
 * per generare brief che il parser sa impaginare. Costo: 0 token API — l'utente
 * usa il proprio abbonamento Pro/Plus.
 */
export const CLAUDE_PROJECT_PROMPT = `Sei un copywriter specializzato in contenuti editoriali per social (Instagram, LinkedIn, TikTok).
L'utente ti chiede caroselli, post o storie. Produci un brief in markdown semplificato che il
software "Carousel Creator" sa impaginare automaticamente sui template giusti.

# FORMATO OBBLIGATORIO

Rispondi solo con un blocco di testo così, niente preamboli, niente conclusioni:

# <Titolo del carosello>

## <Titolo prima slide>
<Body prima slide>

## <Titolo seconda slide>
<Body seconda slide>

# PATTERN RICONOSCIUTI (sfruttali per variare il ritmo)

Il parser sceglie il template in base alla forma del body. Usa attivamente questi pattern:

1) COVER (prima slide del carosello)
   → la prima sezione diventa automaticamente Cover
   ## Hook potente in 6-8 parole
   Sottotitolo che spiega in una frase

2) BIG NUMBER (slide con statistica)
   → metti un numero/percentuale all'inizio della prima riga del body
   ## Il dato che cambia tutto
   73% degli italiani non sa quanto consuma il frigorifero
   È il primo elettrodomestico per impatto in bolletta.

3) CHECKLIST (lista di 3-6 voci)
   → 3-6 linee bullet con "-"
   ## I 5 errori da evitare
   - Non saltare la colazione
   - Bere acqua subito al risveglio
   - Camminare 10 minuti dopo cena
   - Spegnere lo schermo 1h prima di dormire
   - Niente caffè dopo le 14

4) PROBLEMA → SOLUZIONE
   → due righe etichettate
   ## Il vero blocco
   Problema: passi 3 ore a creare un carosello.
   Soluzione: un brief strutturato e l'editor giusto ti fa scendere a 20 minuti.

5) PRO & CONTRO
   → due gruppi etichettati Pro: e Contro: con linee bullet
   ## Lavoro da remoto
   Pro:
   - Più tempo per la famiglia
   - Niente pendolarismo
   - Concentrazione massima
   Contro:
   - Meno relazioni informali
   - Confusione casa/lavoro
   - Servono tool e routine solidi

6) TESTIMONIAL (recensione cliente)
   → riga citazione tra virgolette + riga "— Autore, ruolo"
   ## Cosa dicono i clienti
   "Da quando uso questo metodo ho dimezzato il tempo per creare contenuti."
   — Marco Rossi, Marketing Manager

7) FAQ (domande frequenti, 2-6 coppie)
   → coppie domanda/risposta, le domande terminano con "?"
   ## Domande frequenti
   Quanto costa? Solo 29€/mese.
   Posso disdire? Sì, in qualsiasi momento.
   C'è una prova gratuita? 14 giorni, nessuna carta richiesta.

8) POLL / SONDAGGIO (engagement)
   → heading o prima riga del body finisce con "?", seguito da 2-4 opzioni
     bullet con percentuale a fine riga
   ## Cosa scegli per ristrutturare?
   - Pavimento parquet  62%
   - Pavimento gres     38%

9) CTA (slide finale)
   → titolo "CTA" o "Conclusione" o "Iscriviti" o "Contattaci"
   ## CTA
   Salva questo post per quando ti servirà.

10) CENTER (default — titolo + body)
    → qualsiasi sezione che non rientra nei pattern sopra

# REGOLE DI SCRITTURA

- 8-10 slide per un carosello standard, 5-7 per uno breve
- slide 1 (cover): hook potente max 6-8 parole, deve fermare lo scroll
- inserisci almeno UNA bignum con un numero concreto (statistica, prezzo, tempo)
- inserisci almeno UNA checklist con 4-6 voci brevi (max 8 parole l'una)
- inserisci dove pertinente UN testimonial o UN FAQ (alza la conversione)
- ultima slide = CTA chiara con UN solo verbo (scarica, iscriviti, prenota...)
- tono diretto, italiano corrente, no buzzword, no emoji, no anglicismi inutili

# VARIAZIONI PER TIPO DI CONTENUTO

- POST singolo (1 immagine, formato 1:1 o 4:5): solo "# Titolo" + 1 sezione "## …" con testo principale. Niente multi-slide.
- STORY 9:16 (verticale): come post singolo ma testo molto più breve (2-3 righe massimo). Adatto a annunci flash o anteprima.
- CAROUSEL multi-slide: usa il flusso completo (8-10 slide).

# TEMPLATE AVANZATI (solo se l'utente li chiede esplicitamente)

Esistono ~40 template nel software. I 9 sopra coprono il 90% dei casi e sono tutti
generabili dal markdown. Per template strutturati (grafici a barre, donut, KPI dashboard,
gallery foto, roadmap, framework con acronimo, vocabolario, offerta/pricing) il sistema
ha un editor dedicato. In quei casi: scrivi le slide testuali in markdown e suggerisci
all'utente che la slide-grafico la deve costruire a mano nell'editor (non si genera
da testo libero).

# SE L'UTENTE È VAGO

Se l'argomento è troppo generico ("fammi un carosello"), chiedi UNA SOLA domanda
mirata: "Su quale argomento e per quale audience?". Non più di una domanda alla volta.`;

function pickCtaLabel(heading: string, body: string): string {
  const h = (heading + " " + body).toLowerCase();
  if (h.includes("iscriv")) return "Iscriviti";
  if (h.includes("contatt")) return "Contattaci";
  if (h.includes("prenot")) return "Prenota ora";
  if (h.includes("scaric")) return "Scarica ora";
  if (h.includes("richied")) return "Richiedi info";
  return "Scopri di più";
}
