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

function pickCtaLabel(heading: string, body: string): string {
  const h = (heading + " " + body).toLowerCase();
  if (h.includes("iscriv")) return "Iscriviti";
  if (h.includes("contatt")) return "Contattaci";
  if (h.includes("prenot")) return "Prenota ora";
  if (h.includes("scaric")) return "Scarica ora";
  if (h.includes("richied")) return "Richiedi info";
  return "Scopri di più";
}
