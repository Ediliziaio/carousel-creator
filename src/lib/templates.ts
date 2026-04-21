// Template definitions for the carousel layouts
export type TemplateId =
  | "split"
  | "grid2x2"
  | "bignum"
  | "center"
  | "timeline"
  | "compare"
  | "vocab"
  | "qa"
  | "checklist"
  | "stat"
  | "cover";

export interface SplitData {
  eyebrow: string;
  title: string;
  paragraphs?: string[];
  list?: { marker: string; text: string }[];
  imageUrl?: string;
}
export interface Grid2x2Data {
  eyebrow: string;
  title: string;
  cells: { num: string; title: string; text: string }[];
}
export interface BigNumData {
  number: string;
  numberSub: string;
  title: string;
  paragraphs: string[];
}
export interface CenterData {
  eyebrow: string;
  title: string;
  sub?: string;
  imageUrl?: string;
}
export interface TimelineData {
  eyebrow: string;
  title: string;
  items: { when: string; title: string; text: string }[];
}
export interface CompareData {
  eyebrow: string;
  title: string;
  before: { tag: string; title: string; items: string[] };
  after: { tag: string; title: string; items: string[] };
}
export interface VocabData {
  category: string;
  word: string;
  pron: string;
  defLabel: string;
  def: string;
  example: string;
}
export interface QAData {
  qLabel: string;
  question: string;
  aLabel: string;
  answer: string[];
}
export interface ChecklistData {
  eyebrow: string;
  title: string;
  meta: string;
  items: { done: boolean; title: string; note?: string }[];
}
export interface StatData {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  note?: string;
}
export interface CoverData {
  eyebrow: string;
  title: string;
  sub?: string;
  imageUrl?: string;
}

export type AnyTemplateData =
  | SplitData
  | Grid2x2Data
  | BigNumData
  | CenterData
  | TimelineData
  | CompareData
  | VocabData
  | QAData
  | ChecklistData
  | StatData
  | CoverData;

/** Per-language data wrapper. When `__i18n` is true, byLang holds entries. */
export interface I18nWrapper<T = AnyTemplateData> {
  __i18n: true;
  byLang: Record<string, T>;
}

export type SlideDataField<T = AnyTemplateData> = T | I18nWrapper<T>;

export interface Slide {
  id: string;
  template: TemplateId;
  data: SlideDataField;
}

/* ============ Brand & Effects ============ */

export type BgPattern =
  | "none"
  | "dots"
  | "grid"
  | "noise"
  | "gradient-mesh"
  | "gradient-radial"
  | "gradient-conic"
  | "blob"
  | "stripes"
  | "waves";
export type BorderStyle = "none" | "thin" | "thick" | "dashed" | "glow";
export type ShadowStyle = "none" | "soft" | "hard" | "colored";
export type CornerStyle = "sharp" | "rounded" | "pill";
export type TitleEffect = "none" | "outline" | "shadow-3d" | "underline-accent" | "highlight-block";
export type DividerStyle = "line" | "dots" | "wave" | "gradient";

export interface BrandEffects {
  bgPattern: BgPattern;
  accentGlow: boolean;
  textGradient: boolean;
  grain: boolean;
  borderStyle: BorderStyle;
  shadow: ShadowStyle;
  cornerStyle: CornerStyle;
  titleEffect: TitleEffect;
  dividerStyle: DividerStyle;
  iconAccent: boolean;
}

export const DEFAULT_EFFECTS: BrandEffects = {
  bgPattern: "none",
  accentGlow: false,
  textGradient: false,
  grain: false,
  borderStyle: "none",
  shadow: "none",
  cornerStyle: "rounded",
  titleEffect: "none",
  dividerStyle: "line",
  iconAccent: false,
};

export type FontChoice =
  | "Figtree"
  | "Inter"
  | "Space Grotesk"
  | "Playfair Display"
  | "JetBrains Mono"
  | "Poppins"
  | "DM Sans"
  | "Manrope";

export const FONT_OPTIONS: FontChoice[] = [
  "Figtree",
  "Inter",
  "Space Grotesk",
  "Playfair Display",
  "JetBrains Mono",
  "Poppins",
  "DM Sans",
  "Manrope",
];

export type Weight = 400 | 500 | 600 | 700 | 800 | 900;

export interface BrandSettings {
  brand: string;
  handle: string;
  accent: string;
  accentSecondary: string;
  textColor: string;
  bgColor: string;
  carouselTitle: string;
  footerCta: string;
  fontHeading: FontChoice;
  fontBody: FontChoice;
  headingWeight: Weight;
  bodyWeight: Weight;
  logoDataUrl?: string;
  effects: BrandEffects;
  languages: string[];
  defaultLanguage: string;
}

export const DEFAULT_BRAND: BrandSettings = {
  brand: "AI CON EDO",
  handle: "@edoardo_barravecchia",
  accent: "#00E5FF",
  accentSecondary: "#B24BF3",
  textColor: "#F5F5F5",
  bgColor: "#0A0A0A",
  carouselTitle: "Nuovo carosello",
  footerCta: "SCORRI →",
  fontHeading: "Figtree",
  fontBody: "Figtree",
  headingWeight: 800,
  bodyWeight: 400,
  logoDataUrl: undefined,
  effects: { ...DEFAULT_EFFECTS },
  languages: ["it"],
  defaultLanguage: "it",
};

export const TEMPLATE_META: Record<TemplateId, { label: string; desc: string }> = {
  split: { label: "Split 50/50", desc: "Titolo a sx, contenuto a dx" },
  grid2x2: { label: "Griglia 2×2", desc: "Titolo + 4 riquadri" },
  bignum: { label: "Numero gigante", desc: "Cifra enorme + contenuto" },
  center: { label: "Frase centrale", desc: "Claim grande centrato" },
  timeline: { label: "Timeline", desc: "Step verticali con pallini" },
  compare: { label: "Prima / Dopo", desc: "Due colonne a confronto" },
  vocab: { label: "Vocabolario", desc: "Definizione di una parola" },
  qa: { label: "Q & A", desc: "Domanda e risposta" },
  checklist: { label: "Checklist", desc: "Caselle da spuntare" },
  stat: { label: "Dato singolo", desc: "Numero enorme + descrizione" },
  cover: { label: "Cover immagine", desc: "Immagine fullscreen + titolo" },
};

export const TEMPLATE_ORDER: TemplateId[] = [
  "split", "grid2x2", "bignum", "center", "timeline",
  "compare", "vocab", "qa", "checklist", "stat", "cover",
];

export function makeDefaultData(template: TemplateId): AnyTemplateData {
  switch (template) {
    case "split":
      return {
        eyebrow: "Cover",
        title: "Titolo della cover con {hl}parole chiave.{/hl}",
        paragraphs: ["Sottotitolo con il gancio principale. Una o due frasi."],
        list: [
          { marker: "01", text: "Elemento indice" },
          { marker: "02", text: "Elemento indice" },
          { marker: "03", text: "Elemento indice" },
        ],
      } as SplitData;
    case "grid2x2":
      return {
        eyebrow: "Concetti chiave",
        title: "Quattro pilastri.",
        cells: [
          { num: "01", title: "Velocità", text: "Esegui in pochi secondi quello che richiedeva ore." },
          { num: "02", title: "Costo", text: "Tagli operativi senza perdere qualità." },
          { num: "03", title: "Scala", text: "Lo stesso flusso per 1 o 1000 casi." },
          { num: "04", title: "Controllo", text: "Tracci ogni passaggio e correggi al volo." },
        ],
      } as Grid2x2Data;
    case "bignum":
      return {
        number: "01",
        numberSub: "PRIMO PASSO",
        title: "Definisci l'obiettivo.",
        paragraphs: [
          "Senza un risultato chiaro, l'AI ti darà output bellissimi ma inutili.",
          "Scrivi in una frase cosa vuoi ottenere.",
        ],
      } as BigNumData;
    case "center":
      return {
        eyebrow: "Idea forte",
        title: "L'AI non sostituisce te. Sostituisce chi non la usa.",
        sub: "Una riflessione semplice ma scomoda.",
      } as CenterData;
    case "timeline":
      return {
        eyebrow: "Roadmap",
        title: "Da zero a produzione.",
        items: [
          { when: "GIORNO 01", title: "Setup", text: "Account, accessi, primo prompt." },
          { when: "GIORNO 03", title: "Prototipo", text: "Versione minima funzionante." },
          { when: "GIORNO 07", title: "Test reali", text: "Dati veri, feedback veri." },
          { when: "GIORNO 14", title: "Live", text: "Pubblichi e misuri." },
        ],
      } as TimelineData;
    case "compare":
      return {
        eyebrow: "Confronto",
        title: "Prima e dopo l'AI.",
        before: { tag: "PRIMA", title: "Lavoro manuale", items: ["Ore di copia-incolla", "Errori di battitura", "Output inconsistente"] },
        after:  { tag: "DOPO",  title: "Flusso AI",      items: ["Minuti, non ore", "Zero refusi", "Output sempre uguale"] },
      } as CompareData;
    case "vocab":
      return {
        category: "GLOSSARIO",
        word: "Prompt",
        pron: "/prɒmpt/ — sostantivo",
        defLabel: "DEFINIZIONE",
        def: "Istruzione testuale data a un modello di intelligenza artificiale per ottenere un output specifico.",
        example: "Un buon prompt vale più di un buon modello.",
      } as VocabData;
    case "qa":
      return {
        qLabel: "Q.",
        question: "L'AI mi ruberà il lavoro?",
        aLabel: "A.",
        answer: [
          "No. Te lo cambierà.",
          "I lavori ripetitivi spariscono. Quelli che richiedono giudizio, gusto e contesto restano — e valgono di più.",
        ],
      } as QAData;
    case "checklist":
      return {
        eyebrow: "Setup",
        title: "Prima di iniziare.",
        meta: "5 PASSI · 10 MIN",
        items: [
          { done: true,  title: "Account creato", note: "Email + password." },
          { done: true,  title: "Modello selezionato" },
          { done: false, title: "Primo prompt scritto", note: "Inizia semplice." },
          { done: false, title: "Output salvato" },
          { done: false, title: "Iterazione" },
        ],
      } as ChecklistData;
    case "stat":
      return {
        label: "PRODUTTIVITÀ",
        value: "10",
        unit: "x",
        sub: "Il tempo che risparmi ogni settimana usando l'AI nei flussi giusti.",
        note: "FONTE — TEST INTERNO 2025",
      } as StatData;
    case "cover":
      return {
        eyebrow: "Cover",
        title: "Il titolo della tua copertina.",
        sub: "Sottotitolo opzionale.",
        imageUrl: undefined,
      } as CoverData;
  }
}

export function makeDefaultSlide(template: TemplateId): Slide {
  return { id: crypto.randomUUID(), template, data: makeDefaultData(template) };
}

// Render title with {hl}...{/hl} as accent-colored highlights
export function renderHighlighted(text: string): { type: "t" | "hl"; v: string }[] {
  const parts: { type: "t" | "hl"; v: string }[] = [];
  const re = /\{hl\}(.*?)\{\/hl\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "t", v: text.slice(last, m.index) });
    parts.push({ type: "hl", v: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "t", v: text.slice(last) });
  return parts;
}
