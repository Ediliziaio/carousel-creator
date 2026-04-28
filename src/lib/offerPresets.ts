export interface OfferPreset {
  id: string;
  name: string;
  createdAt: number;
  builtIn?: boolean;
  ctaLabel?: string;
  priceNew?: string;
  priceOld?: string;
  currency?: string;
  urgency?: string;
}

export type OfferPresetValues = Pick<
  OfferPreset,
  "ctaLabel" | "priceNew" | "priceOld" | "currency" | "urgency"
>;

export const BUILT_IN_OFFER_PRESETS: OfferPreset[] = [
  {
    id: "builtin-black-friday",
    name: "Lancio Black Friday",
    createdAt: 0,
    builtIn: true,
    ctaLabel: "ACQUISTA ORA →",
    priceNew: "47",
    priceOld: "97",
    currency: "€",
    urgency: "Solo per 48h — sconto del 50%",
  },
  {
    id: "builtin-early-bird",
    name: "Early Bird",
    createdAt: 0,
    builtIn: true,
    ctaLabel: "PRENOTA POSTO →",
    priceNew: "97",
    priceOld: "197",
    currency: "€",
    urgency: "Sconto del 50% per i primi 20",
  },
  {
    id: "builtin-standard",
    name: "Standard",
    createdAt: 0,
    builtIn: true,
    ctaLabel: "SCOPRI DI PIÙ →",
    priceNew: "",
    priceOld: "",
    currency: "€",
    urgency: "",
  },
];

export function makeOfferPreset(name: string, values: OfferPresetValues): OfferPreset {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Senza nome",
    createdAt: Date.now(),
    ...values,
  };
}
