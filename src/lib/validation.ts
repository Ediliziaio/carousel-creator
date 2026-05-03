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
  MythData,
  ProcessData,
  ProsConsData,
  QuoteBigData,
  RoadmapData,
  CtaData,
  HookData,
  ProblemSolutionData,
  MistakesData,
  FrameworkData,
  SocialProofData,
  OfferData,
  ObjectionData,
  TipPackData,
  UrgencyData,
  BonusStackData,
  GuaranteeData,
  FaqData,
  QuickWinData,
  MediaHeroData,
  PolaroidStackData,
  SplitDuoData,
  MagazineCoverData,
  ChartAreaData,
  ChartCompareBarData,
  KpiGridData,
  FunnelChartData,
  PollData,
  PricingTableData,
  TeamMemberData,
  StepsGalleryData,
  StatsPackData,
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
  processSteps: { min: 3, max: 6 },
  prosCons: { min: 2, max: 5 },
  roadmap: { min: 3, max: 5 },
  mistakes: { min: 3, max: 5 },
  frameworkLetters: { min: 3, max: 6 },
  offerIncludes: { min: 3, max: 5 },
  tips: { min: 3, max: 6 },
  hookMin: 5,
  hookMax: 90,
  objectionMax: 200,
  letterMax: 3,
  quoteMin: 10,
  quoteMax: 280,
  authorMax: 60,
  captionMax: 80,
  headlineMax: 80,
  buttonMax: 32,
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

export function validateSlideData(
  template: Slide["template"],
  data: AnyTemplateData,
): SlideValidation {
  const errors: FieldError[] = [];
  const err = (field: string, message: string) =>
    errors.push({ field, message, severity: "error" });
  const warn = (field: string, message: string) =>
    errors.push({ field, message, severity: "warning" });

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
        err(
          "images",
          `Galleria: aggiungi almeno ${LIMITS.gallery.min} immagini per renderla efficace (hai ${filled.length})`,
        );
      }
      if (d.images.length > LIMITS.gallery.max) {
        err(
          "images",
          `Galleria: massimo ${LIMITS.gallery.max} immagini supportate (hai ${d.images.length})`,
        );
      }
      d.images.forEach((im, i) => {
        const u = checkImageUrl(im.url);
        if (u) err(`images.${i}.url`, `Immagine ${i + 1}: ${u}`);
        if (im.caption && im.caption.length > LIMITS.captionMax) {
          err(
            `images.${i}.caption`,
            `Didascalia immagine ${i + 1}: massimo ${LIMITS.captionMax} caratteri`,
          );
        }
      });
      break;
    }
    case "imageQuote": {
      const d = data as ImageQuoteData;
      if (empty(d.quote)) {
        err("quote", `Citazione: ${REQUIRED}`);
      } else if (d.quote.length < LIMITS.quoteMin || d.quote.length > LIMITS.quoteMax) {
        err(
          "quote",
          `Citazione: min ${LIMITS.quoteMin}, max ${LIMITS.quoteMax} caratteri (hai ${d.quote.length})`,
        );
      }
      if (empty(d.author)) err("author", `Autore: ${REQUIRED}`);
      else if (d.author.length > LIMITS.authorMax)
        err("author", `Autore: massimo ${LIMITS.authorMax} caratteri`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      else if (!d.imageUrl)
        warn("imageUrl", "Suggerimento: aggiungi una foto per maggiore impatto");
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
        err(
          "segments",
          `Donut: servono almeno ${LIMITS.chartDonut.min} segmenti (hai ${d.segments.length})`,
        );
      if (d.segments.length > LIMITS.chartDonut.max)
        err(
          "segments",
          `Donut: massimo ${LIMITS.chartDonut.max} segmenti (hai ${d.segments.length})`,
        );
      let sum = 0;
      d.segments.forEach((sg, i) => {
        if (empty(sg.label))
          err(`segments.${i}.label`, `Segmento ${i + 1}: etichetta obbligatoria`);
        if (!Number.isFinite(sg.value) || sg.value < 0)
          err(`segments.${i}.value`, `Segmento ${i + 1}: il valore deve essere un numero positivo`);
        else sum += sg.value;
        if (sg.color && !HEX_RE.test(sg.color))
          err(
            `segments.${i}.color`,
            `Segmento ${i + 1}: colore deve essere hex valido (es. #FF0000)`,
          );
      });
      if (sum <= 0 && d.segments.length > 0)
        err("segments", "Donut: la somma dei segmenti deve essere maggiore di zero");
      break;
    }
    case "chartLine": {
      const d = data as ChartLineData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.values.length < LIMITS.chartLine.min)
        err(
          "values",
          `Trend: servono almeno ${LIMITS.chartLine.min} punti per disegnare una curva (hai ${d.values.length})`,
        );
      if (d.values.length > LIMITS.chartLine.max)
        err("values", `Trend: massimo ${LIMITS.chartLine.max} punti (hai ${d.values.length})`);
      if (d.xLabels.length !== d.values.length)
        err(
          "values",
          `Etichette X (${d.xLabels.length}) e valori (${d.values.length}) devono avere la stessa lunghezza`,
        );
      d.values.forEach((v, i) => {
        if (!Number.isFinite(v)) err(`values.${i}`, `Punto ${i + 1}: valore non numerico`);
      });
      break;
    }
    case "feature": {
      const d = data as FeatureData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.bullets.length < LIMITS.featureBullets.min)
        err(
          "bullets",
          `Aggiungi almeno ${LIMITS.featureBullets.min} bullet point (hai ${d.bullets.length})`,
        );
      if (d.bullets.length > LIMITS.featureBullets.max)
        err(
          "bullets",
          `Massimo ${LIMITS.featureBullets.max} bullet point (hai ${d.bullets.length})`,
        );
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
        err(
          "quote",
          `Citazione: min ${LIMITS.quoteMin}, max ${LIMITS.quoteMax} caratteri (hai ${d.quote.length})`,
        );
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
    case "myth": {
      const d = data as MythData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (empty(d.myth?.text)) err("myth.text", `Mito: ${REQUIRED}`);
      if (empty(d.reality?.text)) err("reality.text", `Realtà: ${REQUIRED}`);
      break;
    }
    case "process": {
      const d = data as ProcessData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.steps.length < LIMITS.processSteps.min)
        err("steps", `Servono almeno ${LIMITS.processSteps.min} step (hai ${d.steps.length})`);
      if (d.steps.length > LIMITS.processSteps.max)
        err("steps", `Massimo ${LIMITS.processSteps.max} step (hai ${d.steps.length})`);
      d.steps.forEach((s, i) => {
        if (empty(s.title)) err(`steps.${i}.title`, `Step ${i + 1}: titolo obbligatorio`);
      });
      break;
    }
    case "prosCons": {
      const d = data as ProsConsData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.pros.length < LIMITS.prosCons.min)
        err("pros", `PRO: servono almeno ${LIMITS.prosCons.min} voci (hai ${d.pros.length})`);
      if (d.pros.length > LIMITS.prosCons.max)
        err("pros", `PRO: massimo ${LIMITS.prosCons.max} voci`);
      if (d.cons.length < LIMITS.prosCons.min)
        err("cons", `CONTRO: servono almeno ${LIMITS.prosCons.min} voci (hai ${d.cons.length})`);
      if (d.cons.length > LIMITS.prosCons.max)
        err("cons", `CONTRO: massimo ${LIMITS.prosCons.max} voci`);
      d.pros.forEach((p, i) => {
        if (empty(p)) err(`pros.${i}`, `PRO ${i + 1}: ${REQUIRED}`);
      });
      d.cons.forEach((c, i) => {
        if (empty(c)) err(`cons.${i}`, `CONTRO ${i + 1}: ${REQUIRED}`);
      });
      break;
    }
    case "quoteBig": {
      const d = data as QuoteBigData;
      if (empty(d.quote)) err("quote", `Citazione: ${REQUIRED}`);
      else if (d.quote.length < LIMITS.quoteMin || d.quote.length > LIMITS.quoteMax)
        err(
          "quote",
          `Citazione: min ${LIMITS.quoteMin}, max ${LIMITS.quoteMax} caratteri (hai ${d.quote.length})`,
        );
      if (empty(d.author)) err("author", `Autore: ${REQUIRED}`);
      else if (d.author.length > LIMITS.authorMax)
        err("author", `Autore: massimo ${LIMITS.authorMax} caratteri`);
      const u = checkImageUrl(d.avatarUrl);
      if (u) err("avatarUrl", u);
      break;
    }
    case "roadmap": {
      const d = data as RoadmapData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.milestones.length < LIMITS.roadmap.min)
        err(
          "milestones",
          `Roadmap: servono almeno ${LIMITS.roadmap.min} milestone (hai ${d.milestones.length})`,
        );
      if (d.milestones.length > LIMITS.roadmap.max)
        err("milestones", `Roadmap: massimo ${LIMITS.roadmap.max} milestone`);
      d.milestones.forEach((m, i) => {
        if (empty(m.title)) err(`milestones.${i}.title`, `Milestone ${i + 1}: titolo obbligatorio`);
        if (empty(m.period))
          err(`milestones.${i}.period`, `Milestone ${i + 1}: periodo obbligatorio`);
      });
      break;
    }
    case "cta": {
      const d = data as CtaData;
      if (empty(d.headline)) err("headline", `Headline: ${REQUIRED}`);
      else if (d.headline.length > LIMITS.headlineMax)
        err("headline", `Headline: massimo ${LIMITS.headlineMax} caratteri`);
      if (empty(d.buttonLabel)) err("buttonLabel", `Bottone: ${REQUIRED}`);
      else if (d.buttonLabel.length > LIMITS.buttonMax)
        err("buttonLabel", `Bottone: massimo ${LIMITS.buttonMax} caratteri`);
      break;
    }
    case "hook": {
      const d = data as HookData;
      if (empty(d.hook)) err("hook", `Hook: ${REQUIRED}`);
      else if (d.hook.length < LIMITS.hookMin || d.hook.length > LIMITS.hookMax)
        err(
          "hook",
          `Hook: tra ${LIMITS.hookMin} e ${LIMITS.hookMax} caratteri (hai ${d.hook.length})`,
        );
      break;
    }
    case "problemSolution": {
      const d = data as ProblemSolutionData;
      if (empty(d.problem?.text)) err("problem.text", `Problema: ${REQUIRED}`);
      if (empty(d.solution?.text)) err("solution.text", `Soluzione: ${REQUIRED}`);
      break;
    }
    case "mistakes": {
      const d = data as MistakesData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.mistakes.length < LIMITS.mistakes.min)
        err(
          "mistakes",
          `Errori: servono almeno ${LIMITS.mistakes.min} voci (hai ${d.mistakes.length})`,
        );
      if (d.mistakes.length > LIMITS.mistakes.max)
        err("mistakes", `Errori: massimo ${LIMITS.mistakes.max}`);
      d.mistakes.forEach((m, i) => {
        if (empty(m.title)) err(`mistakes.${i}.title`, `Errore ${i + 1}: titolo obbligatorio`);
      });
      break;
    }
    case "framework": {
      const d = data as FrameworkData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (empty(d.acronym)) err("acronym", `Acronimo: ${REQUIRED}`);
      if (d.letters.length < LIMITS.frameworkLetters.min)
        err(
          "letters",
          `Lettere: servono almeno ${LIMITS.frameworkLetters.min} (hai ${d.letters.length})`,
        );
      if (d.letters.length > LIMITS.frameworkLetters.max)
        err("letters", `Lettere: massimo ${LIMITS.frameworkLetters.max}`);
      d.letters.forEach((l, i) => {
        if (empty(l.letter)) err(`letters.${i}.letter`, `Lettera ${i + 1}: ${REQUIRED}`);
        else if (l.letter.length > LIMITS.letterMax)
          err(`letters.${i}.letter`, `Lettera ${i + 1}: max ${LIMITS.letterMax} caratteri`);
        if (empty(l.name)) err(`letters.${i}.name`, `Lettera ${i + 1}: nome obbligatorio`);
      });
      break;
    }
    case "socialProof": {
      const d = data as SocialProofData;
      if (empty(d.clientName)) err("clientName", `Cliente: ${REQUIRED}`);
      if (empty(d.tagline)) err("tagline", `Tagline: ${REQUIRED}`);
      if (d.metrics.length !== 3)
        err("metrics", `Metriche: devono essere esattamente 3 (hai ${d.metrics.length})`);
      d.metrics.forEach((m, i) => {
        if (empty(m.value)) err(`metrics.${i}.value`, `Metrica ${i + 1}: valore obbligatorio`);
        if (empty(m.label)) err(`metrics.${i}.label`, `Metrica ${i + 1}: etichetta obbligatoria`);
      });
      const u = checkImageUrl(d.logoUrl);
      if (u) err("logoUrl", u);
      break;
    }
    case "offer": {
      const d = data as OfferData;
      if (empty(d.productName)) err("productName", `Nome prodotto: ${REQUIRED}`);
      if (empty(d.priceNew)) err("priceNew", `Prezzo: ${REQUIRED}`);
      if (empty(d.ctaLabel)) err("ctaLabel", `Etichetta CTA: ${REQUIRED}`);
      else if (d.ctaLabel.length > LIMITS.buttonMax)
        err("ctaLabel", `CTA: massimo ${LIMITS.buttonMax} caratteri`);
      if (d.includes.length < LIMITS.offerIncludes.min)
        err(
          "includes",
          `Inclusi: servono almeno ${LIMITS.offerIncludes.min} voci (hai ${d.includes.length})`,
        );
      if (d.includes.length > LIMITS.offerIncludes.max)
        err("includes", `Inclusi: massimo ${LIMITS.offerIncludes.max}`);
      d.includes.forEach((it, i) => {
        if (empty(it)) err(`includes.${i}`, `Incluso ${i + 1}: ${REQUIRED}`);
      });
      break;
    }
    case "objection": {
      const d = data as ObjectionData;
      if (empty(d.objection)) err("objection", `Obiezione: ${REQUIRED}`);
      else if (d.objection.length > LIMITS.objectionMax)
        err("objection", `Obiezione: massimo ${LIMITS.objectionMax} caratteri`);
      if (empty(d.answer)) err("answer", `Risposta: ${REQUIRED}`);
      else if (d.answer.length > LIMITS.objectionMax)
        err("answer", `Risposta: massimo ${LIMITS.objectionMax} caratteri`);
      break;
    }
    case "tipPack": {
      const d = data as TipPackData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (d.tips.length < LIMITS.tips.min)
        err("tips", `Tip: servono almeno ${LIMITS.tips.min} voci (hai ${d.tips.length})`);
      if (d.tips.length > LIMITS.tips.max) err("tips", `Tip: massimo ${LIMITS.tips.max}`);
      d.tips.forEach((t, i) => {
        if (empty(t.title)) err(`tips.${i}.title`, `Tip ${i + 1}: titolo obbligatorio`);
      });
      break;
    }
    case "urgency": {
      const d = data as UrgencyData;
      if (empty(d.headline)) err("headline", `Headline: ${REQUIRED}`);
      else if (d.headline.length > LIMITS.headlineMax)
        err("headline", `Headline: massimo ${LIMITS.headlineMax} caratteri`);
      if (empty(d.deadline)) err("deadline", `Countdown: ${REQUIRED}`);
      if (empty(d.ctaLabel)) err("ctaLabel", `CTA: ${REQUIRED}`);
      else if (d.ctaLabel.length > LIMITS.buttonMax)
        err("ctaLabel", `CTA: massimo ${LIMITS.buttonMax} caratteri`);
      break;
    }
    case "bonusStack": {
      const d = data as BonusStackData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (empty(d.yourPrice)) err("yourPrice", `Prezzo finale: ${REQUIRED}`);
      if (empty(d.ctaLabel)) err("ctaLabel", `CTA: ${REQUIRED}`);
      else if (d.ctaLabel.length > LIMITS.buttonMax)
        err("ctaLabel", `CTA: massimo ${LIMITS.buttonMax} caratteri`);
      if (!d.bonuses || d.bonuses.length < 1) {
        err("bonuses", "Bonus: aggiungi almeno 1 bonus");
      } else {
        if (d.bonuses.length > 6) err("bonuses", `Bonus: massimo 6 (hai ${d.bonuses.length})`);
        d.bonuses.forEach((b, i) => {
          if (empty(b.name)) err(`bonuses.${i}.name`, `Bonus ${i + 1}: nome obbligatorio`);
          if (empty(b.value)) err(`bonuses.${i}.value`, `Bonus ${i + 1}: valore obbligatorio`);
        });
      }
      break;
    }
    case "guarantee": {
      const d = data as GuaranteeData;
      if (empty(d.headline)) err("headline", `Headline: ${REQUIRED}`);
      if (empty(d.body)) err("body", `Testo garanzia: ${REQUIRED}`);
      break;
    }
    case "faq": {
      const d = data as FaqData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.items || d.items.length < 2) {
        err("items", `FAQ: servono almeno 2 voci (hai ${d.items?.length ?? 0})`);
      } else {
        if (d.items.length > 6) err("items", `FAQ: massimo 6 voci (hai ${d.items.length})`);
        d.items.forEach((it, i) => {
          if (empty(it.q)) err(`items.${i}.q`, `FAQ ${i + 1}: domanda obbligatoria`);
          if (empty(it.a)) err(`items.${i}.a`, `FAQ ${i + 1}: risposta obbligatoria`);
        });
      }
      break;
    }
    case "quickWin": {
      const d = data as QuickWinData;
      if (empty(d.instruction)) err("instruction", `Istruzione: ${REQUIRED}`);
      if (!d.steps || d.steps.length < 1) {
        err("steps", "Step: aggiungi almeno 1 step");
      } else {
        if (d.steps.length > 5) err("steps", `Step: massimo 5 (hai ${d.steps.length})`);
        d.steps.forEach((s, i) => {
          if (empty(s)) err(`steps.${i}`, `Step ${i + 1}: ${REQUIRED}`);
        });
      }
      break;
    }
    case "mediaHero": {
      const d = data as MediaHeroData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      else if (!d.imageUrl)
        warn("imageUrl", "Suggerimento: aggiungi una foto fullbleed per maggiore impatto");
      break;
    }
    case "polaroidStack": {
      const d = data as PolaroidStackData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.polaroids || d.polaroids.length < 1) {
        err("polaroids", "Polaroid: aggiungi almeno 1 immagine");
      } else {
        if (d.polaroids.length > 3)
          err("polaroids", `Polaroid: massimo 3 (hai ${d.polaroids.length})`);
        const filled = d.polaroids.filter((p) => p.url && p.url.trim()).length;
        if (filled < 1) warn("polaroids", "Suggerimento: carica almeno un'immagine");
        d.polaroids.forEach((p, i) => {
          const u = checkImageUrl(p.url);
          if (u) err(`polaroids.${i}.url`, `Polaroid ${i + 1}: ${u}`);
        });
      }
      break;
    }
    case "splitDuo": {
      const d = data as SplitDuoData;
      if (empty(d.leftImage?.label)) err("leftImage.label", `Etichetta sinistra: ${REQUIRED}`);
      if (empty(d.rightImage?.label)) err("rightImage.label", `Etichetta destra: ${REQUIRED}`);
      if (empty(d.centerBadge)) err("centerBadge", `Badge centrale: ${REQUIRED}`);
      const ul = checkImageUrl(d.leftImage?.url);
      if (ul) err("leftImage.url", ul);
      const ur = checkImageUrl(d.rightImage?.url);
      if (ur) err("rightImage.url", ur);
      break;
    }
    case "magazineCover": {
      const d = data as MagazineCoverData;
      if (empty(d.masthead)) err("masthead", `Masthead: ${REQUIRED}`);
      if (empty(d.mainHeadline)) err("mainHeadline", `Headline: ${REQUIRED}`);
      const u = checkImageUrl(d.imageUrl);
      if (u) err("imageUrl", u);
      else if (!d.imageUrl) warn("imageUrl", "Suggerimento: aggiungi una foto centrale");
      if (!d.coverLines || d.coverLines.length < 1) {
        err("coverLines", "Cover lines: aggiungi almeno 1 strillo");
      } else if (d.coverLines.length > 4) {
        err("coverLines", `Cover lines: massimo 4 (hai ${d.coverLines.length})`);
      }
      break;
    }
    case "chartArea": {
      const d = data as ChartAreaData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.values || d.values.length < 3)
        err("values", `Servono almeno 3 punti (hai ${d.values?.length ?? 0})`);
      if (d.values && d.values.length > 24)
        err("values", `Massimo 24 punti (hai ${d.values.length})`);
      if (d.xLabels && d.values && d.xLabels.length !== d.values.length)
        err(
          "values",
          `Etichette X (${d.xLabels.length}) e valori (${d.values.length}) devono coincidere`,
        );
      d.values?.forEach((v, i) => {
        if (!Number.isFinite(v)) err(`values.${i}`, `Punto ${i + 1}: valore non numerico`);
      });
      break;
    }
    case "chartCompareBar": {
      const d = data as ChartCompareBarData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (empty(d.seriesA?.label)) err("seriesA.label", `Serie A: ${REQUIRED}`);
      if (empty(d.seriesB?.label)) err("seriesB.label", `Serie B: ${REQUIRED}`);
      if (!d.rows || d.rows.length < 2) {
        err("rows", `Servono almeno 2 righe (hai ${d.rows?.length ?? 0})`);
      } else {
        if (d.rows.length > 6) err("rows", `Massimo 6 righe (hai ${d.rows.length})`);
        d.rows.forEach((r, i) => {
          if (empty(r.label)) err(`rows.${i}.label`, `Riga ${i + 1}: etichetta obbligatoria`);
          if (!Number.isFinite(r.valueA) || r.valueA < 0)
            err(`rows.${i}.valueA`, `Riga ${i + 1}: valore A non valido`);
          if (!Number.isFinite(r.valueB) || r.valueB < 0)
            err(`rows.${i}.valueB`, `Riga ${i + 1}: valore B non valido`);
        });
      }
      if (d.seriesA?.color && !HEX_RE.test(d.seriesA.color))
        err("seriesA.color", "Colore A: usa hex (#RRGGBB)");
      if (d.seriesB?.color && !HEX_RE.test(d.seriesB.color))
        err("seriesB.color", "Colore B: usa hex (#RRGGBB)");
      break;
    }
    case "kpiGrid": {
      const d = data as KpiGridData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.kpis || d.kpis.length !== 4) {
        err("kpis", `KPI: devono essere esattamente 4 (hai ${d.kpis?.length ?? 0})`);
      } else {
        d.kpis.forEach((k, i) => {
          if (empty(k.label)) err(`kpis.${i}.label`, `KPI ${i + 1}: etichetta obbligatoria`);
          if (empty(k.value)) err(`kpis.${i}.value`, `KPI ${i + 1}: valore obbligatorio`);
          if (empty(k.delta)) err(`kpis.${i}.delta`, `KPI ${i + 1}: delta obbligatorio`);
          if (!k.spark || k.spark.length < 3)
            err(`kpis.${i}.spark`, `KPI ${i + 1}: sparkline serve almeno 3 punti`);
          if (k.spark && k.spark.length > 12)
            err(`kpis.${i}.spark`, `KPI ${i + 1}: sparkline max 12 punti`);
        });
      }
      break;
    }
    case "funnelChart": {
      const d = data as FunnelChartData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.stages || d.stages.length < 2) {
        err("stages", `Stadi: servono almeno 2 (hai ${d.stages?.length ?? 0})`);
      } else {
        if (d.stages.length > 5) err("stages", `Stadi: massimo 5 (hai ${d.stages.length})`);
        d.stages.forEach((s, i) => {
          if (empty(s.label)) err(`stages.${i}.label`, `Stadio ${i + 1}: etichetta obbligatoria`);
          if (empty(s.value)) err(`stages.${i}.value`, `Stadio ${i + 1}: valore obbligatorio`);
        });
      }
      break;
    }
    case "poll": {
      const d = data as PollData;
      if (empty(d.question)) err("question", `Domanda: ${REQUIRED}`);
      if (!d.options || d.options.length < 2) {
        err("options", `Opzioni: servono almeno 2 (hai ${d.options?.length ?? 0})`);
      } else {
        if (d.options.length > 4) err("options", `Opzioni: massimo 4 (hai ${d.options.length})`);
        d.options.forEach((o, i) => {
          if (empty(o.label))
            err(`options.${i}.label`, `Opzione ${i + 1}: etichetta obbligatoria`);
        });
      }
      break;
    }
    case "teamMember": {
      const d = data as TeamMemberData;
      if (empty(d.name)) err("name", `Nome: ${REQUIRED}`);
      if (empty(d.role)) err("role", `Ruolo: ${REQUIRED}`);
      break;
    }
    case "stepsGallery": {
      const d = data as StepsGalleryData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.steps || d.steps.length < 2) {
        err("steps", `Step: servono almeno 2 (hai ${d.steps?.length ?? 0})`);
      } else if (d.steps.length > 4) {
        err("steps", `Step: massimo 4 (hai ${d.steps.length})`);
      } else {
        d.steps.forEach((s, i) => {
          if (empty(s.title)) err(`steps.${i}.title`, `Step ${i + 1}: titolo obbligatorio`);
        });
      }
      break;
    }
    case "statsPack": {
      const d = data as StatsPackData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.stats || d.stats.length < 2) {
        err("stats", `Numeri: servono almeno 2 (hai ${d.stats?.length ?? 0})`);
      } else if (d.stats.length > 4) {
        err("stats", `Numeri: massimo 4 (hai ${d.stats.length})`);
      } else {
        d.stats.forEach((s, i) => {
          if (empty(s.value)) err(`stats.${i}.value`, `Numero ${i + 1}: valore obbligatorio`);
          if (empty(s.label)) err(`stats.${i}.label`, `Numero ${i + 1}: etichetta obbligatoria`);
        });
      }
      break;
    }
    case "pricingTable": {
      const d = data as PricingTableData;
      if (empty(d.title)) err("title", `Titolo: ${REQUIRED}`);
      if (!d.plans || d.plans.length < 2) {
        err("plans", `Piani: servono almeno 2 (hai ${d.plans?.length ?? 0})`);
      } else {
        if (d.plans.length > 3) err("plans", `Piani: massimo 3 (hai ${d.plans.length})`);
        d.plans.forEach((p, i) => {
          if (empty(p.name)) err(`plans.${i}.name`, `Piano ${i + 1}: nome obbligatorio`);
          if (empty(p.price)) err(`plans.${i}.price`, `Piano ${i + 1}: prezzo obbligatorio`);
          if (!p.features || p.features.length === 0)
            err(`plans.${i}.features`, `Piano ${i + 1}: almeno 1 feature obbligatoria`);
        });
      }
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

export function getFieldError(
  slide: Slide,
  field: string,
  lang?: string,
  defaultLang?: string,
): string | undefined {
  const all = validateSlide(slide, lang, defaultLang).errors;
  return all.find((e) => e.field === field && (e.severity ?? "error") === "error")?.message;
}
