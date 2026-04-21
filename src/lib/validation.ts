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
} from "./templates";
import { TEMPLATE_META } from "./templates";

export interface FieldError {
  field: string;
  message: string;
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

export function validateSlide(slide: Slide): SlideValidation {
  const errors: FieldError[] = [];
  switch (slide.template) {
    case "split": {
      const d = slide.data as SplitData;
      if (empty(d.title)) errors.push({ field: "title", message: `Titolo: ${REQUIRED}` });
      break;
    }
    case "grid2x2": {
      const d = slide.data as Grid2x2Data;
      if (empty(d.title)) errors.push({ field: "title", message: `Titolo: ${REQUIRED}` });
      d.cells.forEach((c, i) => {
        if (empty(c.title))
          errors.push({ field: `cells.${i}.title`, message: `Cella ${i + 1} — Titolo riquadro: ${REQUIRED}` });
      });
      break;
    }
    case "bignum": {
      const d = slide.data as BigNumData;
      if (empty(d.number)) errors.push({ field: "number", message: `Numero: ${REQUIRED}` });
      if (empty(d.title)) errors.push({ field: "title", message: `Titolo: ${REQUIRED}` });
      break;
    }
    case "center": {
      const d = slide.data as CenterData;
      if (empty(d.title)) errors.push({ field: "title", message: `Frase principale: ${REQUIRED}` });
      break;
    }
    case "timeline": {
      const d = slide.data as TimelineData;
      if (empty(d.title)) errors.push({ field: "title", message: `Titolo: ${REQUIRED}` });
      if (!d.items.some((it) => !empty(it.title))) {
        const firstIdx = d.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0)
          errors.push({ field: `items.${firstIdx}.title`, message: `Step 1 — Titolo: ${REQUIRED}` });
        else errors.push({ field: "items", message: "Step: aggiungi almeno una voce" });
      }
      break;
    }
    case "compare": {
      const d = slide.data as CompareData;
      if (empty(d.title)) errors.push({ field: "title", message: `Titolo: ${REQUIRED}` });
      if (empty(d.before.title))
        errors.push({ field: "before.title", message: `Colonna 'Prima' — Titolo: ${REQUIRED}` });
      if (empty(d.after.title))
        errors.push({ field: "after.title", message: `Colonna 'Dopo' — Titolo: ${REQUIRED}` });
      if (!d.before.items.some((s) => !empty(s))) {
        const firstIdx = d.before.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0)
          errors.push({ field: `before.items.${firstIdx}`, message: `Colonna 'Prima' — Voce 1: ${REQUIRED}` });
        else errors.push({ field: "before.items", message: "Colonna 'Prima' — Voci: aggiungi almeno una voce" });
      }
      if (!d.after.items.some((s) => !empty(s))) {
        const firstIdx = d.after.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0)
          errors.push({ field: `after.items.${firstIdx}`, message: `Colonna 'Dopo' — Voce 1: ${REQUIRED}` });
        else errors.push({ field: "after.items", message: "Colonna 'Dopo' — Voci: aggiungi almeno una voce" });
      }
      break;
    }
    case "vocab": {
      const d = slide.data as VocabData;
      if (empty(d.word)) errors.push({ field: "word", message: `Parola: ${REQUIRED}` });
      if (empty(d.def)) errors.push({ field: "def", message: `Definizione: ${REQUIRED}` });
      break;
    }
    case "qa": {
      const d = slide.data as QAData;
      if (empty(d.question)) errors.push({ field: "question", message: `Domanda: ${REQUIRED}` });
      if (!d.answer.some((p) => !empty(p))) {
        const firstIdx = d.answer.length > 0 ? 0 : -1;
        if (firstIdx >= 0)
          errors.push({ field: `answer.${firstIdx}`, message: `Risposta — Paragrafo 1: ${REQUIRED}` });
        else errors.push({ field: "answer", message: "Risposta: aggiungi almeno un paragrafo" });
      }
      break;
    }
    case "checklist": {
      const d = slide.data as ChecklistData;
      if (empty(d.title)) errors.push({ field: "title", message: `Titolo: ${REQUIRED}` });
      if (!d.items.some((it) => !empty(it.title))) {
        const firstIdx = d.items.length > 0 ? 0 : -1;
        if (firstIdx >= 0)
          errors.push({ field: `items.${firstIdx}.title`, message: `Voce 1 — Titolo: ${REQUIRED}` });
        else errors.push({ field: "items", message: "Voci: aggiungi almeno una voce" });
      }
      break;
    }
    case "stat": {
      const d = slide.data as StatData;
      if (empty(d.value)) errors.push({ field: "value", message: `Valore: ${REQUIRED}` });
      if (empty(d.label)) errors.push({ field: "label", message: `Etichetta: ${REQUIRED}` });
      break;
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateAllSlides(slides: Slide[]): SlideValidationResult[] {
  return slides
    .map((s, i) => {
      const v = validateSlide(s);
      return {
        slideId: s.id,
        slideIndex: i,
        templateLabel: TEMPLATE_META[s.template].label,
        errors: v.errors,
        firstField: v.errors[0]?.field ?? "",
      };
    })
    .filter((r) => r.errors.length > 0);
}

/** Lookup helper: get error for a specific field path on a slide. */
export function getFieldError(slide: Slide, field: string): string | undefined {
  return validateSlide(slide).errors.find((e) => e.field === field)?.message;
}
