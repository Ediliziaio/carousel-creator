import type {
  Slide,
  SplitData,
  Grid2x2Data,
  BigNumData,
  CenterData,
  TimelineData,
  CompareData,
  VocabData,
  QAData,
  ChecklistData,
  StatData,
  CoverData,
  GalleryData,
  ImageQuoteData,
  ChartBarData,
  ChartDonutData,
  ChartLineData,
  FeatureData,
  TestimonialData,
  AnyTemplateData,
} from "./templates";
import { TEMPLATE_META } from "./templates";
import { getSlideData } from "./i18n";

export type FieldSeverity = "error" | "warning";

export interface FieldError {
  field: string;
  message: string;
  severity?: FieldSeverity; // default "error"
}

export interface SlideValidation {
  valid: boolean;
  errors: FieldError[];
}

export interface SlideValidationResult {
  slideId: string;
  slideIndex: number;
  templateLabel: string;
  errors: FieldError[];
  firstField: string;
}

const empty = (s?: string) => !s || !s.trim();
const REQUIRED = "campo obbligatorio";

/** Limits used by editor counters & disabled add buttons. */
export const LIMITS = {
  gallery: { min: 2, max: 6 },
  chartBar: { min: 2, max: 8 },
  chartDonut: { min: 2, max: 8 },
  chartLine: { min: 3, max: 24 },
  featureBullets: { min: 2, max: 5 },
  quoteMin: 10,
  quoteMax: 280,
  authorMax: 60,
  captionMax: 80,
} as const;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const SAFE_DATA_RE = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i;
const SAFE_HTTP_RE = /^https?:\/\/[^\s]+$/i;
const UNSAFE_RE = /^(javascript|vbscript|data:text|data:application):/i;

/** Returns null if valid, otherwise an error message. Empty values are considered valid (use required check separately). */
export function checkImageUrl(url?: string): string | null {
  if (!url || !url.trim()) return null;
  const v = url.trim();
  if (UNSAFE_RE.test(v)) return "URL immagine non sicuro: usa solo immagini PNG/JPG/WEBP";
  if (SAFE_DATA_RE.test(v)) return null;
  if (SAFE_HTTP_RE.test(v)) return null;
  return "URL immagine non valido (usa http(s):// o un upload)";
}

export function validateSlideData(template: Slide["template"], data: AnyTemplateData): SlideValidation {
  const errors: FieldError[] = [];
  const err = (field: string, message: string) => errors.push({ field, message, severity: "error" });
  const warn = (field: string, message: string) => errors.push({ field, message, severity: "warning" });

  switch (template) {
    case "split": {
      const d = data as SplitData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      break;
    }
    case "grid2x2": {
      const d = data as Grid2x2Data;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      d.cells.forEach((c, i) => {
        if (empty(c.title))
          err(`cells.${i}.title`, `Cella ${i + 1} — Titolo riquadro: ${REQUIRED}`);
      });
      break;
    }
    case "bignum": {
      const d = data as BigNumData;
      if (empty(d.number)) err("number", `Numero: ${REQUIRED}`);
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      break;
    }
    case "center": {
      const d = data as CenterData;
      if (empty(d.title)) err("title", `Frase principale: ${REQUIRED}`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      break;
    }
    case "timeline": {
      const d = data as TimelineData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.items.some((it) => !empty(it.title))) {
        const firstIdx = d.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0) err(`items.${firstIdx}.title`, `Step 1 — Titolo: ${REQUIRED}`);
        else err("items", "Step: aggiungi almeno una voce");
      }
      break;
    }
    case "compare": {
      const d = data as CompareData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (empty(d.before.title)) err("before.title", `Colonna 'Prima' — Titolo: ${REQUIRED}`);
      if (empty(d.after.title)) err("after.title", `Colonna 'Dopo' — Titolo: ${REQUIRED}`);
      if (!d.before.items.some((s) => !empty(s))) {
        const firstIdx = d.before.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0) err(`before.items.${firstIdx}`, `Colonna 'Prima' — Voce 1: ${REQUIRED}`);
        else err("before.items", "Colonna 'Prima' — Voci: aggiungi almeno una voce");
      }
      if (!d.after.items.some((s) => !empty(s))) {
        const firstIdx = d.after.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0) err(`after.items.${firstIdx}`, `Colonna 'Dopo' — Voce 1: ${REQUIRED}`);
        else err("after.items", "Colonna 'Dopo' — Voci: aggiungi almeno una voce");
      }
      break;
    }
    case "vocab": {
      const d = data as VocabData;
      if (empty(d.word)) err("word", `Parola: ${REQUIRED}`);
      if (empty(d.def)) err("def", `Definizione: ${REQUIRED}`);
      break;
    }
    case "qa": {
      const d = data as QAData;
      if (empty(d.question)) err("question", `Domanda: ${REQUIRED}`);
      if (!d.answer.some((p) => !empty(p))) {
        const firstIdx = d.answer.length > 0 ? 0 : -1;
        if (firstIdx >= 0) err(`answer.${firstIdx}`, `Risposta — Paragrafo 1: ${REQUIRED}`);
        else err("answer", "Risposta: aggiungi almeno un paragrafo");
      }
      break;
    }
    case "checklist": {
      const d = data as ChecklistData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.items.some((it) => !empty(it.title))) {
        const firstIdx = d.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0) err(`items.${firstIdx}.title`, `Voce 1 — Titolo: ${REQUIRED}`);
        else err("items", "Voci: aggiungi almeno una voce");
      }
      break;
    }
    case "stat": {
      const d = data as StatData;
      if (empty(d.value)) err("value", `Valore: ${REQUIRED}`);
      if (empty(d.label)) err("label", `Etichetta: ${REQUIRED}`);
      break;
    }
    case "cover": {
      const d = data as CoverData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      break;
    }
    case "gallery": {
      const d = data as GalleryData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      const filled = d.images.filter((im) => im.url && im.url.trim());
      if (filled.length < LIMITS.gallery.min) {
        err("images", `Galleria: aggiungi almeno ${LIMITS.gallery.min} immagini per renderla efficace (hai ${filled.length})`);
      }
      if (d.images.length > LIMITS.gallery.max) {
        err("images", `Galleria: massimo ${LIMITS.gallery.max} immagini supportate (hai ${d.images.length})`);
      }
      d.images.forEach((im, i) => {
        const u = checkImageUrl(im.url);
        if (u) err(`images.${i}.url`, `Immagine ${i + 1}: ${u}`);
        if (im.caption && im.caption.length > LIMITS.captionMax) {
          err(`images.${i}.caption`, `Didascalia immagine ${i + 1}: massimo ${LIMITS.captionMax} caratteri`);
        }
      });
      break;
    }
    case "imageQuote": {
      const d = data as ImageQuoteData;
      if (empty(d.quote)) {
        err("quote", `Citazione: ${REQUIRED}`);
      } else if (d.quote.length < LIMITS.quoteMin || d.quote.length > LIMITS.quoteMax) {
        err("quote", `Citazione: min ${LIMITS.quoteMin}, max ${LIMITS.quoteMax} caratteri (hai ${d.quote.length})`);
      }
      if (empty(d.author)) err("author", `Autore: ${REQUIRED}`);
      else if (d.author.length > LIMITS.authorMax)
        err("author", `Autore: massimo ${LIMITS.authorMax} caratteri`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      else if (!d.imageUrl) warn("imageUrl", "Suggerimento: aggiungi una foto per maggiore impatto");
      break;
    }
    case "chartBar": {
      const d = data as ChartBarData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.items.length < LIMITS.chartBar.min)
        err("items", `Grafico: servono almeno ${LIMITS.chartBar.min} voci (hai ${d.items.length})`);
      if (d.items.length > LIMITS.chartBar.max)
        err("items", `Grafico: massimo ${LIMITS.chartBar.max} voci (hai ${d.items.length})`);
      d.items.forEach((it, i) => {
        if (empty(it.label)) err(`items.${i}.label`, `Voce ${i + 1}: etichetta obbligatoria`);
        if (!Number.isFinite(it.value) || it.value < 0)
          err(`items.${i}.value`, `Voce ${i + 1}: il valore deve essere un numero positivo`);
        if (it.color && !HEX_RE.test(it.color))
          err(`items.${i}.color`, `Voce ${i + 1}: colore deve essere hex valido (es. #FF0000)`);
      });
      break;
    }
    case "chartDonut": {
      const d = data as ChartDonutData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.segments.length < LIMITS.chartDonut.min)
        err("segments", `Donut: servono almeno ${LIMITS.chartDonut.min} segmenti (hai ${d.segments.length})`);
      if (d.segments.length > LIMITS.chartDonut.max)
        err("segments", `Donut: massimo ${LIMITS.chartDonut.max} segmenti (hai ${d.segments.length})`);
      let sum = 0;
      d.segments.forEach((sg, i) => {
        if (empty(sg.label)) err(`segments.${i}.label`, `Segmento ${i + 1}: etichetta obbligatoria`);
        if (!Number.isFinite(sg.value) || sg.value < 0)
          err(`segments.${i}.value`, `Segmento ${i + 1}: il valore deve essere un numero positivo`);
        else sum += sg.value;
        if (sg.color && !HEX_RE.test(sg.color))
          err(`segments.${i}.color`, `Segmento ${i + 1}: colore deve essere hex valido (es. #FF0000)`);
      });
      if (sum <= 0 && d.segments.length > 0)
        err("segments", "Donut: la somma dei segmenti deve essere maggiore di zero");
      break;
    }
    case "chartLine": {
      const d = data as ChartLineData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.values.length < LIMITS.chartLine.min)
        err("values", `Trend: servono almeno ${LIMITS.chartLine.min} punti per disegnare una curva (hai ${d.values.length})`);
      if (d.values.length > LIMITS.chartLine.max)
        err("values", `Trend: massimo ${LIMITS.chartLine.max} punti (hai ${d.values.length})`);
      if (d.xLabels.length !== d.values.length)
        err("values", `Etichette X (${d.xLabels.length}) e valori (${d.values.length}) devono avere la stessa lunghezza`);
      d.values.forEach((v, i) => {
        if (!Number.isFinite(v))
          err(`values.${i}`, `Punto ${i + 1}: valore non numerico`);
      });
      break;
    }
    case "feature": {
      const d = data as FeatureData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.bullets.length < LIMITS.featureBullets.min)
        err("bullets", `Aggiungi almeno ${LIMITS.featureBullets.min} bullet point (hai ${d.bullets.length})`);
      if (d.bullets.length > LIMITS.featureBullets.max)
        err("bullets", `Massimo ${LIMITS.featureBullets.max} bullet point (hai ${d.bullets.length})`);
      d.bullets.forEach((b, i) => {
        if (empty(b.title)) err(`bullets.${i}.title`, `Bullet ${i + 1}: titolo obbligatorio`);
      });
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      break;
    }
    case "testimonial": {
      const d = data as TestimonialData;
      if (empty(d.quote)) {
        err("quote", `Citazione: ${REQUIRED}`);
      } else if (d.quote.length < LIMITS.quoteMin || d.quote.length > LIMITS.quoteMax) {
        err("quote", `Citazione: min ${LIMITS.quoteMin}, max ${LIMITS.quoteMax} caratteri (hai ${d.quote.length})`);
      }
      if (empty(d.author)) err("author", `Autore: ${REQUIRED}`);
      else if (d.author.length > LIMITS.authorMax)
        err("author", `Autore: massimo ${LIMITS.authorMax} caratteri`);
      if (d.rating !== undefined && d.rating !== 0) {
        if (!Number.isInteger(d.rating) || d.rating < 1 || d.rating > 5)
          err("rating", "Rating: valore intero tra 1 e 5");
      }
      const u = checkImageUrl(d.avatarUrl);
      if (u) err("avatarUrl", u);
      break;
    }
  }
  const onlyErrors = errors.filter((e) => (e.severity ?? "error") === "error");
  return { valid: onlyErrors.length === 0, errors };
}

export function validateSlide(slide: Slide, lang?: string, defaultLang?: string): SlideValidation {
  const data = getSlideData(slide, lang ?? defaultLang ?? "it", defaultLang ?? "it");
  return validateSlideData(slide.template, data);
}

export function validateAllSlides(
  slides: Slide[],
  lang?: string,
  defaultLang?: string,
): SlideValidationResult[] {
  return slides
    .map((s, i) => {
      const v = validateSlide(s, lang, defaultLang);
      const onlyErrors = v.errors.filter((e) => (e.severity ?? "error") === "error");
      return {
        slideId: s.id,
        slideIndex: i,
        templateLabel: TEMPLATE_META[s.template].label,
        errors: onlyErrors,
        firstField: onlyErrors[0]?.field ?? "",
      };
    })
    .filter((r) => r.errors.length > 0);
}

export function getFieldError(slide: Slide, field: string, lang?: string, defaultLang?: string): string | undefined {
  const all = validateSlide(slide, lang, defaultLang).errors;
  return all.find((e) => e.field === field && (e.severity ?? "error") === "error")?.message;
}
