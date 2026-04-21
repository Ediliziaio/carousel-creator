import type { TemplateId, SlideFormat, AnyTemplateData } from "./templates";
import { makeDefaultData } from "./templates";

export interface CarouselPresetSlide {
  template: TemplateId;
  format?: SlideFormat;
  /** Partial overrides merged on top of makeDefaultData(template). */
  overrides?: Partial<AnyTemplateData> & Record<string, unknown>;
}

export interface CarouselPreset {
  id: string;
  name: string;
  description: string;
  /** Emoji icon for the card. */
  icon: string;
  slides: CarouselPresetSlide[];
}

export const BUILT_IN_CAROUSEL_PRESETS: CarouselPreset[] = [
  {
    id: "sales-funnel",
    name: "Sales Funnel completo",
    description: "10 slide ad alta conversione: hook → problema → autorità → prova → obiezione → offerta → CTA.",
    icon: "💰",
    slides: [
      { template: "hook", overrides: { eyebrow: "LEGGI FINO ALLA FINE", hook: "Stai perdendo clienti senza saperlo.", subhook: "E nessuno te lo sta dicendo.", swipeLabel: "SCORRI →" } },
      { template: "problemSolution", overrides: {
        eyebrow: "Il vero problema",
        problem: { label: "IL PROBLEMA", text: "I tuoi contenuti girano ma non vendono. Like sì, clienti no." },
        solution: { label: "LA SOLUZIONE", text: "Un sistema testato che trasforma le visualizzazioni in vendite reali." },
      } },
      { template: "mistakes", overrides: {
        eyebrow: "Errori comuni",
        title: "I 4 errori che ti costano clienti.",
        mistakes: [
          { title: "Vendere subito", why: "Le persone comprano da chi conoscono. Prima dai valore." },
          { title: "Parlare di te", why: "Il cliente vuole sentire dei suoi problemi, non dei tuoi servizi." },
          { title: "Niente CTA chiara", why: "Se non dici cosa fare, nessuno farà nulla." },
          { title: "Pubblicare a caso", why: "Senza calendario coerente l'algoritmo ti penalizza." },
        ],
      } },
      { template: "framework", overrides: {
        eyebrow: "Il metodo",
        title: "Il framework AIDA.",
        acronym: "AIDA",
        letters: [
          { letter: "A", name: "Attention", desc: "Cattura l'attenzione nei primi 3 secondi." },
          { letter: "I", name: "Interest", desc: "Crea curiosità con un dato o una promessa." },
          { letter: "D", name: "Desire", desc: "Mostra il risultato che otterrà." },
          { letter: "A", name: "Action", desc: "Chiudi con una CTA chiara e diretta." },
        ],
      } },
      { template: "socialProof", overrides: {
        eyebrow: "Caso studio",
        clientName: "ACME SRL",
        tagline: "Da 0 a 10k follower in 90 giorni.",
        metrics: [
          { value: "+340", unit: "%", label: "Engagement" },
          { value: "12", unit: "sett", label: "Tempo" },
          { value: "0", unit: "€", label: "Ads spent" },
        ],
        summary: "Sistema di contenuti organici basato su carosello + reel a tema verticale.",
      } },
      { template: "objection", overrides: {
        eyebrow: "Obiezione comune",
        objection: "Ma io non ho tempo di postare ogni giorno…",
        answer: "Non serve. 3 caroselli a settimana ben fatti battono 30 post mediocri. Te lo dimostro.",
        signOff: "P.S. Provalo gratis per 14 giorni.",
      } },
      { template: "offer", overrides: {
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
      } },
      { template: "cta", overrides: {
        eyebrow: "Inizia oggi",
        headline: "Pronto a vendere davvero?",
        subtitle: "Click sul link in bio e attiva il tuo accesso.",
        buttonLabel: "ACQUISTA ORA →",
      } },
    ],
  },
  {
    id: "educational-pack",
    name: "Educational pack",
    description: "8 slide didattiche: cover → hook → consigli → processo → mito → framework → quote → CTA.",
    icon: "🎓",
    slides: [
      { template: "cover", overrides: { eyebrow: "GUIDA", title: "Tutto quello che ti hanno {hl}sbagliato a dire{/hl}.", sub: "Una guida pratica in 8 slide." } },
      { template: "hook", overrides: { eyebrow: "ATTENZIONE", hook: "Il 73% delle persone sbaglia da qui.", subhook: "Vediamo come fare bene.", swipeLabel: "SCORRI →" } },
      { template: "tipPack", overrides: {
        eyebrow: "Quick wins",
        title: "5 modi per crescere in 30 secondi.",
        tips: [
          { icon: "⚡", title: "Hook potente", text: "Le prime 3 parole decidono se leggono." },
          { icon: "🎯", title: "1 idea = 1 post", text: "Non infilare 10 concetti in una slide." },
          { icon: "💾", title: "Save-bait", text: "Crea contenuti che la gente vuole rivedere." },
          { icon: "🔁", title: "CTA al riuso", text: "Dì sempre cosa fare dopo averlo letto." },
          { icon: "📊", title: "Misura tutto", text: "Replica solo ciò che ha funzionato." },
        ],
        saveLabel: "SALVA QUESTO POST",
      } },
      { template: "process" },
      { template: "myth" },
      { template: "framework" },
      { template: "quoteBig" },
      { template: "cta", overrides: { eyebrow: "Continua a imparare", headline: "Vuoi la versione completa?", subtitle: "Iscriviti alla newsletter, è gratis.", buttonLabel: "ISCRIVITI →" } },
    ],
  },
  {
    id: "product-launch",
    name: "Lancio prodotto",
    description: "9 slide per il lancio: hook → claim → feature → prova → pro/contro → offerta → obiezione → CTA.",
    icon: "🚀",
    slides: [
      { template: "hook", overrides: { eyebrow: "NOVITÀ", hook: "È arrivato. Finalmente.", subhook: "Quello che stavi aspettando.", swipeLabel: "SCORRI →" } },
      { template: "center", overrides: { eyebrow: "PRESENTIAMO", title: "Il modo {hl}più semplice{/hl} per X.", sub: "Tutto in un'unica soluzione." } },
      { template: "feature" },
      { template: "socialProof" },
      { template: "prosCons" },
      { template: "offer" },
      { template: "objection" },
      { template: "cta", overrides: { eyebrow: "Disponibile ora", headline: "Prendilo prima che finisca.", subtitle: "Spedizione in 24h, soddisfatti o rimborsati.", buttonLabel: "COMPRA ORA →" } },
    ],
  },
  {
    id: "case-study",
    name: "Case study",
    description: "8 slide caso studio: cover → problema → processo → roadmap → risultati → quote → CTA.",
    icon: "📈",
    slides: [
      { template: "cover", overrides: { eyebrow: "CASO STUDIO", title: "Da 0 a 10k clienti in {hl}90 giorni{/hl}.", sub: "Come abbiamo fatto, passo per passo." } },
      { template: "problemSolution" },
      { template: "process" },
      { template: "roadmap" },
      { template: "socialProof" },
      { template: "quoteBig" },
      { template: "cta", overrides: { eyebrow: "Anche tu", headline: "Vuoi risultati simili?", subtitle: "Prenota una call gratuita di 30 minuti.", buttonLabel: "PRENOTA →" } },
    ],
  },
];

export function getCarouselPreset(id: string): CarouselPreset | undefined {
  return BUILT_IN_CAROUSEL_PRESETS.find((p) => p.id === id);
}

/** Build slide data by merging defaults with preset overrides (deep one-level for nested objects). */
export function buildPresetSlideData(template: TemplateId, overrides?: Record<string, unknown>): AnyTemplateData {
  const base = makeDefaultData(template) as unknown as Record<string, unknown>;
  if (!overrides) return base as unknown as AnyTemplateData;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      out[k] = { ...(base[k] as object), ...(v as object) };
    } else {
      out[k] = v;
    }
  }
  return out as unknown as AnyTemplateData;
}
