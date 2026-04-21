// Template definitions for the carousel layouts
import type * as React from "react";

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
  | "cover"
  | "gallery"
  | "imageQuote"
  | "chartBar"
  | "chartDonut"
  | "chartLine"
  | "feature"
  | "testimonial"
  | "myth"
  | "process"
  | "prosCons"
  | "quoteBig"
  | "roadmap"
  | "cta"
  | "hook"
  | "problemSolution"
  | "mistakes"
  | "framework"
  | "socialProof"
  | "offer"
  | "objection"
  | "tipPack"
  | "urgency"
  | "bonusStack"
  | "guarantee"
  | "faq"
  | "quickWin";

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
export interface GalleryData {
  eyebrow: string;
  title: string;
  images: { url?: string; caption?: string }[];
}
export interface ImageQuoteData {
  imageUrl?: string;
  quote: string;
  author: string;
  role?: string;
}
export interface ChartBarData {
  eyebrow: string;
  title: string;
  unit?: string;
  items: { label: string; value: number; color?: string }[];
}
export interface ChartDonutData {
  eyebrow: string;
  title: string;
  centerLabel?: string;
  segments: { label: string; value: number; color?: string }[];
}
export interface ChartLineData {
  eyebrow: string;
  title: string;
  xLabels: string[];
  values: number[];
  unit?: string;
}
export interface FeatureData {
  eyebrow: string;
  title: string;
  imageUrl?: string;
  bullets: { marker: string; title: string; text?: string }[];
}
export interface TestimonialData {
  avatarUrl?: string;
  quote: string;
  author: string;
  role?: string;
  rating?: number;
}
export interface MythData {
  eyebrow: string;
  title: string;
  myth: { label: string; text: string };
  reality: { label: string; text: string };
  source?: string;
}
export interface ProcessData {
  eyebrow: string;
  title: string;
  steps: { number?: string; title: string; desc: string }[];
}
export interface ProsConsData {
  eyebrow: string;
  title: string;
  prosLabel?: string;
  consLabel?: string;
  pros: string[];
  cons: string[];
}
export interface QuoteBigData {
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
}
export type RoadmapStatus = "done" | "progress" | "planned";
export interface RoadmapData {
  eyebrow: string;
  title: string;
  milestones: { status: RoadmapStatus; period: string; title: string; desc: string }[];
}
export interface CtaData {
  eyebrow?: string;
  headline: string;
  subtitle?: string;
  buttonLabel: string;
  handle?: string;
}
export interface HookData {
  eyebrow?: string;
  hook: string;
  subhook?: string;
  swipeLabel?: string;
}
export interface ProblemSolutionData {
  eyebrow: string;
  problem: { label: string; text: string };
  solution: { label: string; text: string };
}
export interface MistakesData {
  eyebrow: string;
  title: string;
  mistakes: { title: string; why: string }[];
}
export interface FrameworkData {
  eyebrow: string;
  title: string;
  acronym: string;
  letters: { letter: string; name: string; desc: string }[];
}
export interface SocialProofData {
  eyebrow: string;
  clientName: string;
  tagline: string;
  metrics: { value: string; unit?: string; label: string }[];
  summary?: string;
  logoUrl?: string;
}
export interface OfferData {
  badge?: string;
  productName: string;
  priceOld?: string;
  priceNew: string;
  currency?: string;
  includes: string[];
  ctaLabel: string;
  urgency?: string;
}
export interface ObjectionData {
  eyebrow?: string;
  objection: string;
  answer: string;
  signOff?: string;
}
export interface TipPackData {
  eyebrow: string;
  title: string;
  tips: { icon?: string; title: string; text: string }[];
  saveLabel?: string;
}
export interface UrgencyData {
  eyebrow?: string;
  headline: string;
  deadline: string;
  unitsLeft?: string;
  ctaLabel: string;
}
export interface BonusStackData {
  eyebrow: string;
  title: string;
  bonuses: { name: string; description?: string; value: string }[];
  totalValue: string;
  yourPrice: string;
  currency?: string;
  ctaLabel: string;
}
export interface GuaranteeData {
  badge?: string;
  headline: string;
  body: string;
  terms?: string;
  seal?: string;
}
export interface FaqData {
  eyebrow: string;
  title: string;
  items: { q: string; a: string }[];
}
export interface QuickWinData {
  eyebrow?: string;
  instruction: string;
  steps: string[];
  expectedResult?: string;
  timeBadge?: string;
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
  | CoverData
  | GalleryData
  | ImageQuoteData
  | ChartBarData
  | ChartDonutData
  | ChartLineData
  | FeatureData
  | TestimonialData
  | MythData
  | ProcessData
  | ProsConsData
  | QuoteBigData
  | RoadmapData
  | CtaData
  | HookData
  | ProblemSolutionData
  | MistakesData
  | FrameworkData
  | SocialProofData
  | OfferData
  | ObjectionData
  | TipPackData
  | UrgencyData
  | BonusStackData
  | GuaranteeData
  | FaqData
  | QuickWinData;

/** Per-language data wrapper. When `__i18n` is true, byLang holds entries. */
export interface I18nWrapper<T = AnyTemplateData> {
  __i18n: true;
  byLang: Record<string, T>;
}

export type SlideDataField<T = AnyTemplateData> = T | I18nWrapper<T>;

/* ============ Slide formats (Canva-style) ============ */
export type SlideFormat = "portrait" | "square" | "story" | "landscape";

export const FORMAT_DIMENSIONS: Record<
  SlideFormat,
  { w: number; h: number; label: string; ratio: string; desc: string }
> = {
  portrait:  { w: 1080, h: 1350, label: "Post verticale", ratio: "4:5",  desc: "Instagram feed" },
  square:    { w: 1080, h: 1080, label: "Post quadrato",  ratio: "1:1",  desc: "Feed classico" },
  story:     { w: 1080, h: 1920, label: "Storia / Reel",  ratio: "9:16", desc: "Stories e Reels" },
  landscape: { w: 1920, h: 1080, label: "Landscape",      ratio: "16:9", desc: "X / LinkedIn / YouTube" },
};

/* ============ Per-field text style overrides (Canva-style) ============ */
export interface TextStyle {
  fontFamily?: FontChoice;
  fontSize?: number;        // px @ canvas scale
  fontWeight?: Weight;
  letterSpacing?: number;   // em
  textAlign?: "left" | "center" | "right";
  italic?: boolean;
  uppercase?: boolean;
  underline?: boolean;
  color?: string;           // hex
}

export interface Slide {
  id: string;
  template: TemplateId;
  format: SlideFormat;
  data: SlideDataField;
  /** Per-field inline style overrides keyed by field path (e.g. "title", "cells.0.title"). */
  textOverrides?: Record<string, TextStyle>;
}

/* ============ Reusable template+format combos ============ */
export interface SlideCombo {
  id: string;
  name: string;
  template: TemplateId;
  format: SlideFormat;
  createdAt: number;
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

export type MarketingBadgeStyle = "filled" | "outline" | "neon";
export type MarketingGradient = "none" | "subtle" | "bold";
export type MarketingIconSet = "emoji" | "geometric" | "minimal";

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
  /** Style for marketing template badges (offer, socialProof). */
  marketingBadgeStyle?: MarketingBadgeStyle;
  /** Intensity of gradients for marketing templates (hook, cta, offer). */
  marketingGradientIntensity?: MarketingGradient;
  /** Icon set used by marketing templates (mistakes, prosCons, tips). */
  marketingIconSet?: MarketingIconSet;
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
  marketingBadgeStyle: "filled",
  marketingGradientIntensity: "subtle",
  marketingIconSet: "emoji",
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
  gallery: { label: "Galleria 3 foto", desc: "Titolo + 3 immagini con didascalia" },
  imageQuote: { label: "Foto + citazione", desc: "Foto fullscreen + quote sovrimpressa" },
  chartBar: { label: "Grafico a barre", desc: "Confronto valori in barre orizzontali" },
  chartDonut: { label: "Grafico a torta", desc: "Donut chart con legenda" },
  chartLine: { label: "Grafico a linee", desc: "Trend / andamento nel tempo" },
  feature: { label: "Feature spotlight", desc: "Immagine grande + 3 bullet" },
  testimonial: { label: "Testimonianza", desc: "Avatar + quote + autore" },
  myth: { label: "Mito vs Realtà", desc: "Sfata un mito con la verità" },
  process: { label: "Processo a step", desc: "Lista numerata di passaggi" },
  prosCons: { label: "Pro & Contro", desc: "Due colonne a confronto" },
  quoteBig: { label: "Citazione XXL", desc: "Quote tipografica gigante" },
  roadmap: { label: "Roadmap", desc: "Milestone con stati" },
  cta: { label: "Call To Action", desc: "Slide finale con bottone" },
  hook: { label: "Hook iniziale", desc: "Frase shock che ferma lo scroll" },
  problemSolution: { label: "Problema → Soluzione", desc: "Pain in alto, promessa in basso" },
  mistakes: { label: "Errori da evitare", desc: "Lista numerata di errori tipici" },
  framework: { label: "Framework / Acronimo", desc: "Acronimo verticale spiegato" },
  socialProof: { label: "Risultati clienti", desc: "3 metriche + case study" },
  offer: { label: "Offerta / Pricing", desc: "Card prezzo con CTA grande" },
  objection: { label: "Obiezione → Risposta", desc: "Bubble chat per scogliere dubbi" },
  tipPack: { label: "Pacchetto consigli", desc: "Mini-card numerate da salvare" },
  urgency: { label: "Urgenza / Countdown", desc: "Timer XL + scarcity per spinta finale" },
  bonusStack: { label: "Bonus stack", desc: "Lista bonus con valore cumulativo (VSL)" },
  guarantee: { label: "Garanzia / Risk reversal", desc: "Sigillo garanzia + promessa anti-rischio" },
  faq: { label: "FAQ", desc: "Domande & risposte in formato accordion" },
  quickWin: { label: "Quick win", desc: "Azione rapida da fare ora con step" },
};

export const TEMPLATE_ORDER: TemplateId[] = [
  "split", "grid2x2", "bignum", "center", "timeline",
  "compare", "vocab", "qa", "checklist", "stat", "cover",
  "gallery", "imageQuote", "chartBar", "chartDonut", "chartLine",
  "feature", "testimonial",
  "myth", "process", "prosCons", "quoteBig", "roadmap", "cta",
  "hook", "problemSolution", "mistakes", "framework", "socialProof", "offer", "objection", "tipPack",
  "urgency", "bonusStack", "guarantee", "faq", "quickWin",
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
    case "gallery":
      return {
        eyebrow: "Galleria",
        title: "Tre momenti che raccontano il progetto.",
        images: [
          { url: undefined, caption: "Didascalia foto 1" },
          { url: undefined, caption: "Didascalia foto 2" },
          { url: undefined, caption: "Didascalia foto 3" },
        ],
      } as GalleryData;
    case "imageQuote":
      return {
        imageUrl: undefined,
        quote: "Il design non è solo come appare. È come funziona.",
        author: "Steve Jobs",
        role: "Apple",
      } as ImageQuoteData;
    case "chartBar":
      return {
        eyebrow: "Dati",
        title: "Crescita per canale.",
        unit: "%",
        items: [
          { label: "Instagram", value: 78 },
          { label: "TikTok", value: 64 },
          { label: "LinkedIn", value: 42 },
          { label: "YouTube", value: 28 },
        ],
      } as ChartBarData;
    case "chartDonut":
      return {
        eyebrow: "Distribuzione",
        title: "Da dove arriva il traffico.",
        centerLabel: "100%",
        segments: [
          { label: "Organico", value: 45 },
          { label: "Social", value: 30 },
          { label: "Email", value: 15 },
          { label: "Paid", value: 10 },
        ],
      } as ChartDonutData;
    case "chartLine":
      return {
        eyebrow: "Trend 2025",
        title: "Engagement mensile.",
        xLabels: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"],
        values: [12, 19, 17, 28, 34, 41],
        unit: "k",
      } as ChartLineData;
    case "feature":
      return {
        eyebrow: "Funzionalità",
        title: "Tre motivi per provarlo.",
        imageUrl: undefined,
        bullets: [
          { marker: "01", title: "Veloce", text: "Risultati in pochi secondi." },
          { marker: "02", title: "Affidabile", text: "Output stabili e replicabili." },
          { marker: "03", title: "Scalabile", text: "Da 1 a 1000 casi senza sforzo." },
        ],
      } as FeatureData;
    case "testimonial":
      return {
        avatarUrl: undefined,
        quote: "Ha cambiato il modo in cui lavoriamo. Non torneremmo mai indietro.",
        author: "Marta Rossi",
        role: "CEO @ Acme",
        rating: 5,
      } as TestimonialData;
    case "myth":
      return {
        eyebrow: "Mito vs Realtà",
        title: "Sfatiamo un mito sull'AI.",
        myth: { label: "MITO", text: "L'AI sostituirà tutti i creator entro un anno." },
        reality: { label: "REALTÀ", text: "L'AI amplifica chi sa usarla. I creator che la integrano crescono 3x più veloci." },
        source: "FONTE — REPORT 2025",
      } as MythData;
    case "process":
      return {
        eyebrow: "Come funziona",
        title: "Da idea a post in 4 step.",
        steps: [
          { title: "Definisci l'obiettivo", desc: "Cosa vuoi ottenere con questo contenuto?" },
          { title: "Scegli il formato", desc: "Carosello, reel, statico — adatta al messaggio." },
          { title: "Genera con AI", desc: "Prompt chiaro, output veloce, iterazione." },
          { title: "Pubblica e misura", desc: "Posta, leggi i dati, ripeti il ciclo." },
        ],
      } as ProcessData;
    case "prosCons":
      return {
        eyebrow: "Decisione",
        title: "Vale la pena usare l'AI?",
        prosLabel: "PRO",
        consLabel: "CONTRO",
        pros: ["Velocità 10x", "Costi ridotti", "Output replicabili", "Scalabilità immediata"],
        cons: ["Curva di apprendimento", "Output da verificare", "Dipendenza dai tool"],
      } as ProsConsData;
    case "quoteBig":
      return {
        quote: "La creatività è connettere le cose.",
        author: "Steve Jobs",
        role: "Apple",
        avatarUrl: undefined,
      } as QuoteBigData;
    case "roadmap":
      return {
        eyebrow: "Roadmap 2026",
        title: "Cosa stiamo costruendo.",
        milestones: [
          { status: "done", period: "Q4 2025", title: "Lancio beta", desc: "Prime 100 persone a bordo." },
          { status: "progress", period: "Q1 2026", title: "Editor AI", desc: "Generazione contenuti integrata." },
          { status: "planned", period: "Q2 2026", title: "Mobile app", desc: "iOS + Android nativi." },
          { status: "planned", period: "Q3 2026", title: "Marketplace", desc: "Template e preset community." },
        ],
      } as RoadmapData;
    case "cta":
      return {
        eyebrow: "AZIONE",
        headline: "Salva questo post.",
        subtitle: "Tornaci ogni volta che ti serve.",
        buttonLabel: "SALVA ORA →",
        handle: "@edoardo_barravecchia",
      } as CtaData;
    case "hook":
      return {
        eyebrow: "LEGGI FINO ALLA FINE",
        hook: "Il 90% sbaglia questo.",
        subhook: "E nessuno te lo dice.",
        swipeLabel: "SCORRI →",
      } as HookData;
    case "problemSolution":
      return {
        eyebrow: "Problema → Soluzione",
        problem: { label: "IL PROBLEMA", text: "Spendi ore a scrivere contenuti che non convertono." },
        solution: { label: "LA SOLUZIONE", text: "Un framework testato che riduce i tempi del 70% e triplica le conversioni." },
      } as ProblemSolutionData;
    case "mistakes":
      return {
        eyebrow: "Errori comuni",
        title: "I 4 errori che ti costano clienti.",
        mistakes: [
          { title: "Vendere subito", why: "Le persone comprano da chi conoscono. Prima dai valore." },
          { title: "Parlare di te", why: "Il tuo cliente vuole sentire parlare dei suoi problemi, non dei tuoi servizi." },
          { title: "Niente CTA chiara", why: "Se non dici cosa fare, nessuno farà nulla." },
          { title: "Pubblicare a caso", why: "Senza un calendario coerente l'algoritmo ti penalizza." },
        ],
      } as MistakesData;
    case "framework":
      return {
        eyebrow: "Framework",
        title: "Il metodo AIDA.",
        acronym: "AIDA",
        letters: [
          { letter: "A", name: "Attention", desc: "Cattura l'attenzione nei primi 3 secondi." },
          { letter: "I", name: "Interest", desc: "Crea curiosità con un dato o una promessa." },
          { letter: "D", name: "Desire", desc: "Mostra il risultato che otterrà." },
          { letter: "A", name: "Action", desc: "Chiudi con una CTA chiara e diretta." },
        ],
      } as FrameworkData;
    case "socialProof":
      return {
        eyebrow: "Caso studio",
        clientName: "ACME SRL",
        tagline: "Da 0 a 10k follower in 90 giorni.",
        metrics: [
          { value: "+340", unit: "%", label: "Engagement" },
          { value: "12", unit: "sett", label: "Tempo" },
          { value: "0", unit: "€", label: "Ads spent" },
        ],
        summary: "Sistema di contenuti organici basato su carosello + reel a tema verticale.",
        logoUrl: undefined,
      } as SocialProofData;
    case "offer":
      return {
        badge: "OFFERTA LIMITATA",
        productName: "Carosello Sistema Pro",
        priceOld: "297",
        priceNew: "147",
        currency: "€",
        includes: [
          "30 template editabili",
          "Guida video 2h",
          "Community privata",
          "Aggiornamenti a vita",
        ],
        ctaLabel: "ACQUISTA ORA →",
        urgency: "Solo per i primi 50 — scade in 48h",
      } as OfferData;
    case "objection":
      return {
        eyebrow: "Obiezione comune",
        objection: "Ma io non ho tempo di postare ogni giorno…",
        answer: "Non serve postare ogni giorno. 3 caroselli a settimana ben fatti battono 30 post mediocri. Te lo dimostro.",
        signOff: "P.S. Provalo gratis per 14 giorni.",
      } as ObjectionData;
    case "tipPack":
      return {
        eyebrow: "Quick wins",
        title: "5 modi per crescere su Instagram in 30 secondi.",
        tips: [
          { icon: "⚡", title: "Hook potente", text: "Le prime 3 parole decidono se leggono." },
          { icon: "🎯", title: "1 idea = 1 post", text: "Non infilare 10 concetti in una slide." },
          { icon: "💾", title: "Save-bait", text: "Crea contenuti che la gente vuole rivedere." },
          { icon: "🔁", title: "CTA al riuso", text: "Dì sempre cosa fare dopo averlo letto." },
          { icon: "📊", title: "Misura tutto", text: "Replica solo ciò che ha funzionato." },
        ],
        saveLabel: "SALVA QUESTO POST",
      } as TipPackData;
    case "urgency":
      return {
        eyebrow: "URGENTE",
        headline: "Le iscrizioni chiudono tra…",
        deadline: "23:47:12",
        unitsLeft: "Solo 7 posti rimasti",
        ctaLabel: "PRENOTA ORA →",
      } as UrgencyData;
    case "bonusStack":
      return {
        eyebrow: "COSA RICEVI",
        title: "Tutto quello che è incluso oggi.",
        bonuses: [
          { name: "Corso completo", description: "10 moduli video", value: "297" },
          { name: "Workbook PDF", description: "120 pagine + esercizi", value: "97" },
          { name: "Community privata", description: "Accesso a vita", value: "197" },
          { name: "Call 1:1 onboarding", description: "30 min con il team", value: "150" },
        ],
        totalValue: "741",
        yourPrice: "147",
        currency: "€",
        ctaLabel: "VOGLIO TUTTO ORA →",
      } as BonusStackData;
    case "guarantee":
      return {
        badge: "100% SODDISFATTI",
        headline: "Garanzia soddisfatti o rimborsati 30 giorni.",
        body: "Provalo. Se entro 30 giorni non ti convince, ti rimborsiamo tutto. Senza domande, senza giustificazioni.",
        terms: "Basta una mail. Rimborso entro 48h.",
        seal: "🛡️",
      } as GuaranteeData;
    case "faq":
      return {
        eyebrow: "DOMANDE FREQUENTI",
        title: "Le risposte ai dubbi più comuni.",
        items: [
          { q: "Per chi è pensato?", a: "Per chi vuole vendere sui social senza spendere in ads." },
          { q: "Quanto tempo serve?", a: "Bastano 2 ore a settimana per vedere risultati in 30 giorni." },
          { q: "C'è una garanzia?", a: "Sì: 30 giorni soddisfatti o rimborsati al 100%." },
          { q: "Funziona anche per servizi?", a: "Sì, è ottimizzato per coach, consulenti e creator." },
        ],
      } as FaqData;
    case "quickWin":
      return {
        eyebrow: "PROVA SUBITO",
        instruction: "Cambia la bio di Instagram in 60 secondi.",
        steps: [
          "Apri il tuo profilo e clicca 'Modifica profilo'",
          "Scrivi: cosa fai + per chi + risultato (es. 'Aiuto coach a vendere senza ads')",
          "Aggiungi 1 emoji + link in bio",
        ],
        expectedResult: "+30% di click sul link in bio nelle prime 24h.",
        timeBadge: "60 sec",
      } as QuickWinData;
  }
}

export function makeDefaultSlide(template: TemplateId, format: SlideFormat = "portrait"): Slide {
  return { id: crypto.randomUUID(), template, format, data: makeDefaultData(template) };
}

/* ============ Stylable field registry ============ */
/** List of text fields that can receive a per-field style override, per template. */
export function getStylableFields(template: TemplateId, data?: AnyTemplateData): { path: string; label: string }[] {
  switch (template) {
    case "split": {
      const d = data as SplitData | undefined;
      const out: { path: string; label: string }[] = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.paragraphs?.forEach((_, i) => out.push({ path: `paragraphs.${i}`, label: `Paragrafo ${i + 1}` }));
      d?.list?.forEach((_, i) => out.push({ path: `list.${i}.text`, label: `Lista #${i + 1}` }));
      return out;
    }
    case "grid2x2": {
      const d = data as Grid2x2Data | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.cells?.forEach((_, i) => {
        out.push({ path: `cells.${i}.title`, label: `Cella ${i + 1} – titolo` });
        out.push({ path: `cells.${i}.text`, label: `Cella ${i + 1} – testo` });
      });
      return out;
    }
    case "bignum": {
      const d = data as BigNumData | undefined;
      const out = [
        { path: "number", label: "Numero" },
        { path: "numberSub", label: "Sottotitolo numero" },
        { path: "title", label: "Titolo" },
      ];
      d?.paragraphs?.forEach((_, i) => out.push({ path: `paragraphs.${i}`, label: `Paragrafo ${i + 1}` }));
      return out;
    }
    case "center":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Frase principale" },
        { path: "sub", label: "Sottotitolo" },
      ];
    case "timeline": {
      const d = data as TimelineData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.items?.forEach((_, i) => out.push({ path: `items.${i}.title`, label: `Step ${i + 1}` }));
      return out;
    }
    case "compare":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
        { path: "before.title", label: "Prima – titolo" },
        { path: "after.title", label: "Dopo – titolo" },
      ];
    case "vocab":
      return [
        { path: "category", label: "Categoria" },
        { path: "word", label: "Parola" },
        { path: "def", label: "Definizione" },
        { path: "example", label: "Esempio" },
      ];
    case "qa": {
      const d = data as QAData | undefined;
      const out = [
        { path: "question", label: "Domanda" },
      ];
      d?.answer?.forEach((_, i) => out.push({ path: `answer.${i}`, label: `Risposta ${i + 1}` }));
      return out;
    }
    case "checklist": {
      const d = data as ChecklistData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.items?.forEach((_, i) => out.push({ path: `items.${i}.title`, label: `Voce ${i + 1}` }));
      return out;
    }
    case "stat":
      return [
        { path: "label", label: "Etichetta" },
        { path: "value", label: "Valore" },
        { path: "sub", label: "Sottotitolo" },
      ];
    case "cover":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
        { path: "sub", label: "Sottotitolo" },
      ];
    case "gallery": {
      const d = data as GalleryData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.images?.forEach((_, i) => out.push({ path: `images.${i}.caption`, label: `Didascalia ${i + 1}` }));
      return out;
    }
    case "imageQuote":
      return [
        { path: "quote", label: "Citazione" },
        { path: "author", label: "Autore" },
        { path: "role", label: "Ruolo" },
      ];
    case "chartBar": {
      const d = data as ChartBarData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.items?.forEach((_, i) => out.push({ path: `items.${i}.label`, label: `Voce ${i + 1}` }));
      return out;
    }
    case "chartDonut": {
      const d = data as ChartDonutData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.segments?.forEach((_, i) => out.push({ path: `segments.${i}.label`, label: `Segmento ${i + 1}` }));
      return out;
    }
    case "chartLine":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
    case "feature": {
      const d = data as FeatureData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.bullets?.forEach((_, i) => out.push({ path: `bullets.${i}.title`, label: `Bullet ${i + 1}` }));
      return out;
    }
    case "testimonial":
      return [
        { path: "quote", label: "Citazione" },
        { path: "author", label: "Autore" },
        { path: "role", label: "Ruolo" },
      ];
    case "myth":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
        { path: "myth.text", label: "Mito" },
        { path: "reality.text", label: "Realtà" },
      ];
    case "process": {
      const d = data as ProcessData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.steps?.forEach((_, i) => out.push({ path: `steps.${i}.title`, label: `Step ${i + 1} – titolo` }));
      return out;
    }
    case "prosCons": {
      const d = data as ProsConsData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.pros?.forEach((_, i) => out.push({ path: `pros.${i}`, label: `Pro ${i + 1}` }));
      d?.cons?.forEach((_, i) => out.push({ path: `cons.${i}`, label: `Contro ${i + 1}` }));
      return out;
    }
    case "quoteBig":
      return [
        { path: "quote", label: "Citazione" },
        { path: "author", label: "Autore" },
        { path: "role", label: "Ruolo" },
      ];
    case "roadmap": {
      const d = data as RoadmapData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.milestones?.forEach((_, i) => out.push({ path: `milestones.${i}.title`, label: `Milestone ${i + 1}` }));
      return out;
    }
    case "cta":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "headline", label: "Headline" },
        { path: "subtitle", label: "Sottotitolo" },
        { path: "buttonLabel", label: "Bottone" },
      ];
    case "hook":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "hook", label: "Hook" },
        { path: "subhook", label: "Sub-hook" },
      ];
    case "problemSolution":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "problem.text", label: "Problema" },
        { path: "solution.text", label: "Soluzione" },
      ];
    case "mistakes": {
      const d = data as MistakesData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.mistakes?.forEach((_, i) => out.push({ path: `mistakes.${i}.title`, label: `Errore ${i + 1}` }));
      return out;
    }
    case "framework": {
      const d = data as FrameworkData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
        { path: "acronym", label: "Acronimo" },
      ];
      d?.letters?.forEach((_, i) => out.push({ path: `letters.${i}.name`, label: `Lettera ${i + 1} – nome` }));
      return out;
    }
    case "socialProof": {
      const d = data as SocialProofData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "clientName", label: "Cliente" },
        { path: "tagline", label: "Tagline" },
        { path: "summary", label: "Sintesi" },
      ];
      d?.metrics?.forEach((_, i) => out.push({ path: `metrics.${i}.value`, label: `Metrica ${i + 1}` }));
      return out;
    }
    case "offer":
      return [
        { path: "productName", label: "Prodotto" },
        { path: "priceNew", label: "Prezzo nuovo" },
        { path: "ctaLabel", label: "Bottone CTA" },
        { path: "urgency", label: "Urgenza" },
      ];
    case "objection":
      return [
        { path: "objection", label: "Obiezione" },
        { path: "answer", label: "Risposta" },
        { path: "signOff", label: "Chiusura" },
      ];
    case "tipPack": {
      const d = data as TipPackData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.tips?.forEach((_, i) => out.push({ path: `tips.${i}.title`, label: `Tip ${i + 1}` }));
      return out;
    }
    case "urgency":
      return [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "headline", label: "Headline" },
        { path: "deadline", label: "Countdown" },
        { path: "unitsLeft", label: "Posti rimasti" },
        { path: "ctaLabel", label: "CTA" },
      ];
    case "bonusStack": {
      const d = data as BonusStackData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
        { path: "totalValue", label: "Valore totale" },
        { path: "yourPrice", label: "Prezzo finale" },
        { path: "ctaLabel", label: "CTA" },
      ];
      d?.bonuses?.forEach((_, i) => out.push({ path: `bonuses.${i}.name`, label: `Bonus ${i + 1}` }));
      return out;
    }
    case "guarantee":
      return [
        { path: "badge", label: "Badge" },
        { path: "headline", label: "Headline" },
        { path: "body", label: "Testo" },
        { path: "terms", label: "Condizioni" },
      ];
    case "faq": {
      const d = data as FaqData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "title", label: "Titolo" },
      ];
      d?.items?.forEach((_, i) => {
        out.push({ path: `items.${i}.q`, label: `Domanda ${i + 1}` });
        out.push({ path: `items.${i}.a`, label: `Risposta ${i + 1}` });
      });
      return out;
    }
    case "quickWin": {
      const d = data as QuickWinData | undefined;
      const out = [
        { path: "eyebrow", label: "Eyebrow" },
        { path: "instruction", label: "Istruzione" },
        { path: "expectedResult", label: "Risultato atteso" },
        { path: "timeBadge", label: "Badge tempo" },
      ];
      d?.steps?.forEach((_, i) => out.push({ path: `steps.${i}`, label: `Step ${i + 1}` }));
      return out;
    }
  }
}

/** Convert a TextStyle to inline CSS properties. Returns undefined when no overrides exist. */
export function textStyleToCss(style: TextStyle | undefined): React.CSSProperties | undefined {
  if (!style) return undefined;
  const css: React.CSSProperties = {};
  if (style.fontFamily) css.fontFamily = `'${style.fontFamily}', system-ui, sans-serif`;
  if (style.fontSize != null) css.fontSize = `${style.fontSize}px`;
  if (style.fontWeight != null) css.fontWeight = style.fontWeight;
  if (style.letterSpacing != null) css.letterSpacing = `${style.letterSpacing}em`;
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.italic) css.fontStyle = "italic";
  if (style.uppercase) css.textTransform = "uppercase";
  if (style.underline) css.textDecoration = "underline";
  if (style.color) css.color = style.color;
  return Object.keys(css).length > 0 ? css : undefined;
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
