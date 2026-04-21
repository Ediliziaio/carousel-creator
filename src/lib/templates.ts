// Template definitions for the 10 carousel layouts
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
  | "stat";

export interface SplitData {
  eyebrow: string;
  title: string; // supports {hl}word{/hl}
  paragraphs?: string[];
  list?: { marker: string; text: string }[];
}
export interface Grid2x2Data {
  eyebrow: string;
  title: string;
  cells: { num: string; title: string; text: string }[]; // 4 items
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
  answer: string[]; // paragraphs
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

export type SlideData =
  | { template: "split"; data: SplitData }
  | { template: "grid2x2"; data: Grid2x2Data }
  | { template: "bignum"; data: BigNumData }
  | { template: "center"; data: CenterData }
  | { template: "timeline"; data: TimelineData }
  | { template: "compare"; data: CompareData }
  | { template: "vocab"; data: VocabData }
  | { template: "qa"; data: QAData }
  | { template: "checklist"; data: ChecklistData }
  | { template: "stat"; data: StatData };

export interface Slide {
  id: string;
  template: TemplateId;
  data: SplitData | Grid2x2Data | BigNumData | CenterData | TimelineData | CompareData | VocabData | QAData | ChecklistData | StatData;
}

export interface BrandSettings {
  brand: string;
  handle: string;
  accent: string; // hex
  carouselTitle: string;
  footerCta: string;
}

export const DEFAULT_BRAND: BrandSettings = {
  brand: "AI CON EDO",
  handle: "@edoardo_barravecchia",
  accent: "#00E5FF",
  carouselTitle: "Nuovo carosello",
  footerCta: "SCORRI →",
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
};

export const TEMPLATE_ORDER: TemplateId[] = [
  "split", "grid2x2", "bignum", "center", "timeline",
  "compare", "vocab", "qa", "checklist", "stat",
];

export function makeDefaultSlide(template: TemplateId): Slide {
  const id = crypto.randomUUID();
  switch (template) {
    case "split":
      return { id, template, data: {
        eyebrow: "Cover",
        title: "Titolo della cover con {hl}parole chiave.{/hl}",
        paragraphs: ["Sottotitolo con il gancio principale. Una o due frasi."],
        list: [
          { marker: "01", text: "Elemento indice" },
          { marker: "02", text: "Elemento indice" },
          { marker: "03", text: "Elemento indice" },
        ],
      }};
    case "grid2x2":
      return { id, template, data: {
        eyebrow: "Concetti chiave",
        title: "Quattro pilastri.",
        cells: [
          { num: "01", title: "Velocità", text: "Esegui in pochi secondi quello che richiedeva ore." },
          { num: "02", title: "Costo", text: "Tagli operativi senza perdere qualità." },
          { num: "03", title: "Scala", text: "Lo stesso flusso per 1 o 1000 casi." },
          { num: "04", title: "Controllo", text: "Tracci ogni passaggio e correggi al volo." },
        ],
      }};
    case "bignum":
      return { id, template, data: {
        number: "01",
        numberSub: "PRIMO PASSO",
        title: "Definisci l'obiettivo.",
        paragraphs: [
          "Senza un risultato chiaro, l'AI ti darà output bellissimi ma inutili.",
          "Scrivi in una frase cosa vuoi ottenere.",
        ],
      }};
    case "center":
      return { id, template, data: {
        eyebrow: "Idea forte",
        title: "L'AI non sostituisce te. Sostituisce chi non la usa.",
        sub: "Una riflessione semplice ma scomoda.",
      }};
    case "timeline":
      return { id, template, data: {
        eyebrow: "Roadmap",
        title: "Da zero a produzione.",
        items: [
          { when: "GIORNO 01", title: "Setup", text: "Account, accessi, primo prompt." },
          { when: "GIORNO 03", title: "Prototipo", text: "Versione minima funzionante." },
          { when: "GIORNO 07", title: "Test reali", text: "Dati veri, feedback veri." },
          { when: "GIORNO 14", title: "Live", text: "Pubblichi e misuri." },
        ],
      }};
    case "compare":
      return { id, template, data: {
        eyebrow: "Confronto",
        title: "Prima e dopo l'AI.",
        before: { tag: "PRIMA", title: "Lavoro manuale", items: ["Ore di copia-incolla", "Errori di battitura", "Output inconsistente"] },
        after:  { tag: "DOPO",  title: "Flusso AI",      items: ["Minuti, non ore", "Zero refusi", "Output sempre uguale"] },
      }};
    case "vocab":
      return { id, template, data: {
        category: "GLOSSARIO",
        word: "Prompt",
        pron: "/prɒmpt/ — sostantivo",
        defLabel: "DEFINIZIONE",
        def: "Istruzione testuale data a un modello di intelligenza artificiale per ottenere un output specifico.",
        example: "Un buon prompt vale più di un buon modello.",
      }};
    case "qa":
      return { id, template, data: {
        qLabel: "Q.",
        question: "L'AI mi ruberà il lavoro?",
        aLabel: "A.",
        answer: [
          "No. Te lo cambierà.",
          "I lavori ripetitivi spariscono. Quelli che richiedono giudizio, gusto e contesto restano — e valgono di più.",
        ],
      }};
    case "checklist":
      return { id, template, data: {
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
      }};
    case "stat":
      return { id, template, data: {
        label: "PRODUTTIVITÀ",
        value: "10",
        unit: "x",
        sub: "Il tempo che risparmi ogni settimana usando l'AI nei flussi giusti.",
        note: "FONTE — TEST INTERNO 2025",
      }};
  }
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
