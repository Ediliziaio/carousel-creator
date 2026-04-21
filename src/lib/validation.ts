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
}

const empty = (s?: string) => !s || !s.trim();

export function validateSlide(slide: Slide): SlideValidation {
  const errors: FieldError[] = [];
  switch (slide.template) {
    case "split": {
      const d = slide.data as SplitData;
      if (empty(d.title)) errors.push({ field: "title", message: "Titolo obbligatorio" });
      break;
    }
    case "grid2x2": {
      const d = slide.data as Grid2x2Data;
      if (empty(d.title)) errors.push({ field: "title", message: "Titolo obbligatorio" });
      d.cells.forEach((c, i) => {
        if (empty(c.title)) errors.push({ field: `cells.${i}.title`, message: `Riquadro ${i + 1}: titolo obbligatorio` });
      });
      break;
    }
    case "bignum": {
      const d = slide.data as BigNumData;
      if (empty(d.number)) errors.push({ field: "number", message: "Numero obbligatorio" });
      if (empty(d.title)) errors.push({ field: "title", message: "Titolo obbligatorio" });
      break;
    }
    case "center": {
      const d = slide.data as CenterData;
      if (empty(d.title)) errors.push({ field: "title", message: "Frase principale obbligatoria" });
      break;
    }
    case "timeline": {
      const d = slide.data as TimelineData;
      if (empty(d.title)) errors.push({ field: "title", message: "Titolo obbligatorio" });
      if (!d.items.some((it) => !empty(it.title)))
        errors.push({ field: "items", message: "Almeno uno step con titolo" });
      break;
    }
    case "compare": {
      const d = slide.data as CompareData;
      if (empty(d.title)) errors.push({ field: "title", message: "Titolo obbligatorio" });
      if (empty(d.before.title)) errors.push({ field: "before.title", message: "Titolo colonna 'Prima' obbligatorio" });
      if (empty(d.after.title)) errors.push({ field: "after.title", message: "Titolo colonna 'Dopo' obbligatorio" });
      if (!d.before.items.some((s) => !empty(s)))
        errors.push({ field: "before.items", message: "Almeno una voce in 'Prima'" });
      if (!d.after.items.some((s) => !empty(s)))
        errors.push({ field: "after.items", message: "Almeno una voce in 'Dopo'" });
      break;
    }
    case "vocab": {
      const d = slide.data as VocabData;
      if (empty(d.word)) errors.push({ field: "word", message: "Parola obbligatoria" });
      if (empty(d.def)) errors.push({ field: "def", message: "Definizione obbligatoria" });
      break;
    }
    case "qa": {
      const d = slide.data as QAData;
      if (empty(d.question)) errors.push({ field: "question", message: "Domanda obbligatoria" });
      if (!d.answer.some((p) => !empty(p)))
        errors.push({ field: "answer", message: "Almeno un paragrafo di risposta" });
      break;
    }
    case "checklist": {
      const d = slide.data as ChecklistData;
      if (empty(d.title)) errors.push({ field: "title", message: "Titolo obbligatorio" });
      if (!d.items.some((it) => !empty(it.title)))
        errors.push({ field: "items", message: "Almeno una voce con titolo" });
      break;
    }
    case "stat": {
      const d = slide.data as StatData;
      if (empty(d.value)) errors.push({ field: "value", message: "Valore obbligatorio" });
      if (empty(d.label)) errors.push({ field: "label", message: "Etichetta obbligatoria" });
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
      };
    })
    .filter((r) => r.errors.length > 0);
}

/** Lookup helper: get error for a specific field path on a slide. */
export function getFieldError(slide: Slide, field: string): string | undefined {
  return validateSlide(slide).errors.find((e) => e.field === field)?.message;
}
