import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type Slide,
  type TemplateId,
  type SlideFormat,
  type BrandSettings,
  type AnyTemplateData,
  type SlideDataField,
  type TextStyle,
  type SlideCombo,
  DEFAULT_BRAND,
  DEFAULT_EFFECTS,
  makeDefaultSlide,
  makeDefaultData,
} from "./templates";
import {
  type BrandPreset,
  type PresetTheme,
  BUILT_IN_PRESETS,
  themeFromBrand,
  applyThemeToBrand,
  makePreset,
} from "./presets";
import { type CarouselSnapshot, pushSnapshot, snapshot } from "./history";
import { setSlideData, getSlideData } from "./i18n";
import { getCarouselPreset, buildPresetSlideData } from "./carouselPresets";
import type { ImportedItem } from "./contentImport";
import {
  type OfferPreset,
  type OfferPresetValues,
  BUILT_IN_OFFER_PRESETS,
  makeOfferPreset,
} from "./offerPresets";

const DEFAULT_CATEGORY_ORDER = ["text", "data", "media", "ref"];
const DEFAULT_TEMPLATES_PER_CATEGORY: Record<string, TemplateId[]> = {
  text: [
    "cover",
    "center",
    "split",
    "bignum",
    "myth",
    "quoteBig",
    "hook",
    "objection",
    "urgency",
    "guarantee",
    "quickWin",
  ],
  data: [
    "grid2x2",
    "timeline",
    "checklist",
    "stat",
    "compare",
    "chartBar",
    "chartDonut",
    "chartLine",
    "chartArea",
    "chartCompareBar",
    "kpiGrid",
    "funnelChart",
    "process",
    "prosCons",
    "roadmap",
    "problemSolution",
    "mistakes",
    "framework",
    "socialProof",
    "tipPack",
    "faq",
    "poll",
    "pricingTable",
    "statsPack",
  ],
  media: [
    "gallery",
    "imageQuote",
    "feature",
    "testimonial",
    "mediaHero",
    "polaroidStack",
    "splitDuo",
    "magazineCover",
    "teamMember",
    "stepsGallery",
  ],
  ref: ["vocab", "qa", "cta", "offer", "bonusStack"],
};

/** Merge persisted picker state with defaults so newly-added templates/categories appear. */
function mergePickerState(
  persistedOrder: string[] | undefined,
  persistedTemplates: Record<string, TemplateId[]> | undefined,
): { templateCategoryOrder: string[]; templatesPerCategory: Record<string, TemplateId[]> } {
  const order = persistedOrder ?? [...DEFAULT_CATEGORY_ORDER];
  // Append any default categories the user is missing (e.g. "media" added later).
  for (const cat of DEFAULT_CATEGORY_ORDER) {
    if (!order.includes(cat)) order.push(cat);
  }
  const templates: Record<string, TemplateId[]> = { ...(persistedTemplates ?? {}) };
  for (const cat of DEFAULT_CATEGORY_ORDER) {
    const defaults = DEFAULT_TEMPLATES_PER_CATEGORY[cat];
    const existing = templates[cat] ?? [];
    // Append missing defaults at the end, preserving user order.
    const merged = [...existing];
    for (const t of defaults) if (!merged.includes(t)) merged.push(t);
    templates[cat] = merged;
  }
  return { templateCategoryOrder: order, templatesPerCategory: templates };
}

interface CarouselState {
  brand: BrandSettings;
  slides: Slide[];
  activeId: string | null;
  activeLang: string;

  /** All available brand presets (built-in + user). */
  brandPresets: BrandPreset[];

  /** Saved template+format combos for quick reuse. */
  slideCombos: SlideCombo[];

  /** User-customised category order in the New Slide dialog. */
  templateCategoryOrder: string[];
  /** User-customised template order within each category. */
  templatesPerCategory: Record<string, TemplateId[]>;

  /** Block export when validation errors are present. */
  strictExport: boolean;
  /** Show overlays in preview when validation errors are present. */
  validationOverlay: boolean;

  past: CarouselSnapshot[];
  future: CarouselSnapshot[];

  setBrand: (b: Partial<BrandSettings>) => void;
  addLanguage: (code: string) => void;
  removeLanguage: (code: string) => void;
  setActiveLang: (code: string) => void;
  setDefaultLanguage: (code: string) => void;

  addSlide: (template: TemplateId, format?: SlideFormat) => void;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  updateSlide: (id: string, data: AnyTemplateData) => void;
  reorderSlides: (from: number, to: number) => void;
  setActive: (id: string) => void;
  loadJSON: (json: { brand: BrandSettings; slides: Slide[] }) => void;

  /** Per-field text style overrides */
  setTextOverride: (slideId: string, fieldPath: string, style: TextStyle) => void;
  clearTextOverride: (slideId: string, fieldPath: string) => void;

  /** Bulk: trova/sostituisci testo in tutte le slide. Ritorna numero di occorrenze sostituite. */
  replaceTextInAllSlides: (find: string, replace: string, caseSensitive: boolean) => number;
  /** Bulk: rimuove tutti i textOverrides delle slide (reset font/colori a default template). */
  clearAllTextOverrides: () => void;

  /** Memory of last fontSize used per field type (e.g. {title: 100, paragraphs: 36}). */
  lastFontSizeByFieldType: Record<string, number>;
  setLastFontSizeForFieldType: (typeKey: string, size: number) => void;

  /** Slide combos */
  saveSlideCombo: (name: string, template: TemplateId, format: SlideFormat) => void;
  deleteSlideCombo: (id: string) => void;

  /** Picker DnD ordering */
  setTemplateCategoryOrder: (order: string[]) => void;
  setTemplatesForCategory: (category: string, templates: TemplateId[]) => void;
  resetPickerOrder: () => void;

  /** Brand presets actions */
  saveBrandPreset: (name: string) => void;
  applyBrandPreset: (id: string) => void;
  deleteBrandPreset: (id: string) => void;
  renameBrandPreset: (id: string, name: string) => void;
  resetBrandToDefault: () => void;

  /** Carousel presets */
  loadCarouselPreset: (presetId: string) => void;
  appendCarouselPreset: (presetId: string) => void;

  /** Quick offer propagation */
  propagateOfferFields: (
    patch: {
      ctaLabel?: string;
      priceNew?: string;
      priceOld?: string;
      currency?: string;
      urgency?: string;
      badge?: string;
    },
    opts: { overwriteCustom: boolean },
  ) => { offerCount: number; ctaCount: number };

  /** Content import */
  importContentBundle: (items: ImportedItem[], mode: "replace" | "append") => void;

  /** Strict export toggle */
  setStrictExport: (v: boolean) => void;
  setValidationOverlay: (v: boolean) => void;

  /** Bulk update marketing slides (hook/offer/cta) — single undo entry */
  bulkUpdateMarketingSlides: (
    updates: { slideId: string; patch: Record<string, unknown> }[],
  ) => void;

  /** Offer presets (Quick Offer reusable values) */
  offerPresets: OfferPreset[];
  saveOfferPreset: (name: string, values: OfferPresetValues) => void;
  deleteOfferPreset: (id: string) => void;
  renameOfferPreset: (id: string, name: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const initial1 = makeDefaultSlide("split");
const initial2 = makeDefaultSlide("center");

function withHistory<T extends Partial<CarouselState>>(
  s: CarouselState,
  patch: T,
): T & { past: CarouselSnapshot[]; future: CarouselSnapshot[] } {
  return {
    ...patch,
    past: pushSnapshot(s.past, snapshot(s.brand, s.slides)),
    future: [],
  };
}

/** Merge persisted brand with DEFAULT_BRAND so newly-added effect fields fall back gracefully. */
function mergeBrand(persisted: Partial<BrandSettings> | undefined): BrandSettings {
  if (!persisted) return DEFAULT_BRAND;
  return {
    ...DEFAULT_BRAND,
    ...persisted,
    effects: { ...DEFAULT_EFFECTS, ...(persisted.effects ?? {}) },
  };
}

export const useCarousel = create<CarouselState>()(
  persist(
    (set, get) => ({
      brand: DEFAULT_BRAND,
      slides: [initial1, initial2],
      activeId: initial1.id,
      activeLang: DEFAULT_BRAND.defaultLanguage,
      brandPresets: BUILT_IN_PRESETS,
      slideCombos: [],
      templateCategoryOrder: [...DEFAULT_CATEGORY_ORDER],
      templatesPerCategory: { ...DEFAULT_TEMPLATES_PER_CATEGORY },
      lastFontSizeByFieldType: {},
      strictExport: true,
      validationOverlay: true,
      past: [],
      future: [],

      setBrand: (b) => set((s) => withHistory(s, { brand: { ...s.brand, ...b } })),

      addLanguage: (code) =>
        set((s) => {
          if (s.brand.languages.includes(code)) return {};
          return withHistory(s, {
            brand: { ...s.brand, languages: [...s.brand.languages, code] },
          });
        }),

      removeLanguage: (code) =>
        set((s) => {
          if (!s.brand.languages.includes(code) || s.brand.languages.length <= 1) return {};
          const langs = s.brand.languages.filter((l) => l !== code);
          const newDefault = code === s.brand.defaultLanguage ? langs[0] : s.brand.defaultLanguage;
          const slides = s.slides.map((sl) => {
            const d = sl.data;
            if (typeof d === "object" && d !== null && (d as { __i18n?: boolean }).__i18n) {
              const w = d as { __i18n: true; byLang: Record<string, AnyTemplateData> };
              const { [code]: _removed, ...rest } = w.byLang;
              void _removed;
              return { ...sl, data: { __i18n: true as const, byLang: rest } };
            }
            return sl;
          });
          return withHistory(s, {
            brand: { ...s.brand, languages: langs, defaultLanguage: newDefault },
            slides,
            activeLang: s.activeLang === code ? newDefault : s.activeLang,
          });
        }),

      setActiveLang: (code) => set({ activeLang: code }),

      setDefaultLanguage: (code) =>
        set((s) => {
          if (!s.brand.languages.includes(code)) return {};
          return withHistory(s, { brand: { ...s.brand, defaultLanguage: code } });
        }),

      addSlide: (template, format = "portrait") =>
        set((s) => {
          const slide = makeDefaultSlide(template, format);
          return withHistory(s, { slides: [...s.slides, slide], activeId: slide.id });
        }),

      removeSlide: (id) =>
        set((s) => {
          const slides = s.slides.filter((sl) => sl.id !== id);
          const activeId = s.activeId === id ? (slides[0]?.id ?? null) : s.activeId;
          return withHistory(s, { slides, activeId });
        }),

      duplicateSlide: (id) =>
        set((s) => {
          const idx = s.slides.findIndex((sl) => sl.id === id);
          if (idx === -1) return {};
          const copy: Slide = {
            ...s.slides[idx],
            id: crypto.randomUUID(),
            data: structuredClone(s.slides[idx].data) as SlideDataField,
          };
          const slides = [...s.slides];
          slides.splice(idx + 1, 0, copy);
          return withHistory(s, { slides, activeId: copy.id });
        }),

      updateSlide: (id, data) =>
        set((s) => ({
          ...withHistory(s, {
            slides: s.slides.map((sl) =>
              sl.id === id
                ? {
                    ...sl,
                    data: setSlideData(sl.data, s.activeLang, data, s.brand.defaultLanguage),
                  }
                : sl,
            ),
          }),
        })),

      reorderSlides: (from, to) =>
        set((s) => {
          const slides = [...s.slides];
          const [moved] = slides.splice(from, 1);
          slides.splice(to, 0, moved);
          return withHistory(s, { slides });
        }),

      setActive: (id) => set({ activeId: id }),

      loadJSON: (json) =>
        set((s) => {
          const migrated = json.slides.map((sl) => ({
            ...sl,
            format: (sl as Partial<Slide>).format ?? ("portrait" as SlideFormat),
          }));
          return withHistory(s, {
            brand: mergeBrand(json.brand),
            slides: migrated,
            activeId: migrated[0]?.id ?? null,
            activeLang: json.brand?.defaultLanguage ?? "it",
          });
        }),

      /* Per-field text overrides */
      setTextOverride: (slideId, fieldPath, style) =>
        set((s) =>
          withHistory(s, {
            slides: s.slides.map((sl) => {
              if (sl.id !== slideId) return sl;
              const next = { ...(sl.textOverrides ?? {}) };
              if (Object.keys(style).length === 0) {
                delete next[fieldPath];
              } else {
                next[fieldPath] = style;
              }
              return { ...sl, textOverrides: Object.keys(next).length > 0 ? next : undefined };
            }),
          }),
        ),

      replaceTextInAllSlides: (find, replace, caseSensitive) => {
        if (!find) return 0;
        let count = 0;
        const flags = caseSensitive ? "g" : "gi";
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(escaped, flags);
        const visit = (val: unknown): unknown => {
          if (typeof val === "string") {
            const matches = val.match(re);
            if (matches) {
              count += matches.length;
              return val.replace(re, replace);
            }
            return val;
          }
          if (Array.isArray(val)) return val.map(visit);
          if (val && typeof val === "object") {
            const out: Record<string, unknown> = {};
            for (const k of Object.keys(val)) {
              out[k] = visit((val as Record<string, unknown>)[k]);
            }
            return out;
          }
          return val;
        };
        set((s) =>
          withHistory(s, {
            slides: s.slides.map((sl) => ({
              ...sl,
              data: visit(sl.data) as typeof sl.data,
            })),
          }),
        );
        return count;
      },

      clearAllTextOverrides: () =>
        set((s) =>
          withHistory(s, {
            slides: s.slides.map((sl) => ({ ...sl, textOverrides: undefined })),
          }),
        ),

      clearTextOverride: (slideId, fieldPath) =>
        set((s) =>
          withHistory(s, {
            slides: s.slides.map((sl) => {
              if (sl.id !== slideId || !sl.textOverrides) return sl;
              const next = { ...sl.textOverrides };
              delete next[fieldPath];
              return { ...sl, textOverrides: Object.keys(next).length > 0 ? next : undefined };
            }),
          }),
        ),

      setLastFontSizeForFieldType: (typeKey, size) =>
        set((s) => ({
          lastFontSizeByFieldType: { ...s.lastFontSizeByFieldType, [typeKey]: size },
        })),

      /* Slide combos */
      saveSlideCombo: (name, template, format) =>
        set((s) => ({
          slideCombos: [
            ...s.slideCombos,
            {
              id: crypto.randomUUID(),
              name: name.trim() || "Senza nome",
              template,
              format,
              createdAt: Date.now(),
            },
          ],
        })),

      deleteSlideCombo: (id) =>
        set((s) => ({ slideCombos: s.slideCombos.filter((c) => c.id !== id) })),

      /* Picker DnD ordering */
      setTemplateCategoryOrder: (order) => set({ templateCategoryOrder: order }),
      setTemplatesForCategory: (category, templates) =>
        set((s) => ({
          templatesPerCategory: { ...s.templatesPerCategory, [category]: templates },
        })),
      resetPickerOrder: () =>
        set({
          templateCategoryOrder: [...DEFAULT_CATEGORY_ORDER],
          templatesPerCategory: { ...DEFAULT_TEMPLATES_PER_CATEGORY },
        }),

      /* Brand presets */
      saveBrandPreset: (name) =>
        set((s) => {
          const preset = makePreset(name, themeFromBrand(s.brand));
          return { brandPresets: [...s.brandPresets, preset] };
        }),

      applyBrandPreset: (id) =>
        set((s) => {
          const preset = s.brandPresets.find((p) => p.id === id);
          if (!preset) return {};
          return withHistory(s, { brand: applyThemeToBrand(s.brand, preset.theme) });
        }),

      deleteBrandPreset: (id) =>
        set((s) => ({
          brandPresets: s.brandPresets.filter((p) => p.id !== id || p.builtIn),
        })),

      renameBrandPreset: (id, name) =>
        set((s) => ({
          brandPresets: s.brandPresets.map((p) =>
            p.id === id && !p.builtIn ? { ...p, name: name.trim() || p.name } : p,
          ),
        })),

      resetBrandToDefault: () => set((s) => withHistory(s, { brand: DEFAULT_BRAND })),

      /* Carousel presets */
      loadCarouselPreset: (presetId) =>
        set((s) => {
          const preset = getCarouselPreset(presetId);
          if (!preset) return {};
          const slides: Slide[] = preset.slides.map((ps) => ({
            id: crypto.randomUUID(),
            template: ps.template,
            format: ps.format ?? "portrait",
            data: buildPresetSlideData(ps.template, ps.overrides),
          }));
          return withHistory(s, {
            slides,
            activeId: slides[0]?.id ?? null,
          });
        }),

      appendCarouselPreset: (presetId) =>
        set((s) => {
          const preset = getCarouselPreset(presetId);
          if (!preset) return {};
          const newSlides: Slide[] = preset.slides.map((ps) => ({
            id: crypto.randomUUID(),
            template: ps.template,
            format: ps.format ?? "portrait",
            data: buildPresetSlideData(ps.template, ps.overrides),
          }));
          return withHistory(s, {
            slides: [...s.slides, ...newSlides],
            activeId: newSlides[0]?.id ?? s.activeId,
          });
        }),

      /* Quick offer propagation */
      propagateOfferFields: (patch, opts) => {
        const state = get();
        let offerCount = 0;
        let ctaCount = 0;
        const offerDefaults = makeDefaultData("offer") as unknown as Record<string, unknown>;
        const ctaDefaults = makeDefaultData("cta") as unknown as Record<string, unknown>;

        const applyOfferPatch = (current: Record<string, unknown>): Record<string, unknown> => {
          const next: Record<string, unknown> = { ...current };
          const fields: (keyof typeof patch)[] = [
            "ctaLabel",
            "priceNew",
            "priceOld",
            "currency",
            "urgency",
            "badge",
          ];
          for (const f of fields) {
            const v = patch[f];
            if (v === undefined) continue;
            const cur = current[f];
            const def = offerDefaults[f];
            if (opts.overwriteCustom || cur === undefined || cur === "" || cur === def) {
              next[f] = v;
            }
          }
          // Derive badge from urgency when badge missing.
          if (
            !patch.badge &&
            patch.urgency &&
            (!current.badge || current.badge === offerDefaults.badge)
          ) {
            next.badge = patch.urgency;
          }
          return next;
        };

        const applyCtaPatch = (current: Record<string, unknown>): Record<string, unknown> => {
          if (patch.ctaLabel === undefined) return current;
          const cur = current.buttonLabel;
          const def = ctaDefaults.buttonLabel;
          if (opts.overwriteCustom || cur === undefined || cur === "" || cur === def) {
            return { ...current, buttonLabel: patch.ctaLabel };
          }
          return current;
        };

        const transformData = (template: TemplateId, data: AnyTemplateData): AnyTemplateData => {
          if (template === "offer") {
            offerCount++;
            return applyOfferPatch(
              data as unknown as Record<string, unknown>,
            ) as unknown as AnyTemplateData;
          }
          if (template === "cta") {
            ctaCount++;
            return applyCtaPatch(
              data as unknown as Record<string, unknown>,
            ) as unknown as AnyTemplateData;
          }
          return data;
        };

        const slides: Slide[] = state.slides.map((sl) => {
          if (sl.template !== "offer" && sl.template !== "cta") return sl;
          const d = sl.data;
          if (typeof d === "object" && d !== null && (d as { __i18n?: boolean }).__i18n) {
            const w = d as { __i18n: true; byLang: Record<string, AnyTemplateData> };
            const byLang: Record<string, AnyTemplateData> = {};
            for (const [lang, langData] of Object.entries(w.byLang)) {
              byLang[lang] = transformData(sl.template, langData);
            }
            return { ...sl, data: { __i18n: true as const, byLang } };
          }
          return { ...sl, data: transformData(sl.template, d as AnyTemplateData) };
        });

        set(withHistory(state, { slides }));
        return { offerCount, ctaCount };
      },

      /* Content import */
      importContentBundle: (items, mode) =>
        set((s) => {
          const newSlides: Slide[] = items.map((it) => ({
            id: crypto.randomUUID(),
            template: it.template,
            format: "portrait",
            data: it.data,
          }));
          if (newSlides.length === 0) return {};
          if (mode === "replace") {
            return withHistory(s, {
              slides: newSlides,
              activeId: newSlides[0].id,
            });
          }
          return withHistory(s, {
            slides: [...s.slides, ...newSlides],
            activeId: newSlides[0].id,
          });
        }),

      setStrictExport: (v) => set({ strictExport: v }),
      setValidationOverlay: (v) => set({ validationOverlay: v }),

      bulkUpdateMarketingSlides: (updates) =>
        set((s) => {
          const map = new Map(updates.map((u) => [u.slideId, u.patch]));
          const slides = s.slides.map((sl) => {
            const patch = map.get(sl.id);
            if (!patch) return sl;
            const lang = s.activeLang;
            const def = s.brand.defaultLanguage;
            const current = getSlideData(sl, lang, def) as unknown as Record<string, unknown>;
            const merged = { ...current, ...patch } as unknown as AnyTemplateData;
            return { ...sl, data: setSlideData(sl.data, lang, merged, def) };
          });
          return withHistory(s, { slides });
        }),

      offerPresets: BUILT_IN_OFFER_PRESETS,

      saveOfferPreset: (name, values) =>
        set((s) => ({
          offerPresets: [...s.offerPresets, makeOfferPreset(name, values)],
        })),

      deleteOfferPreset: (id) =>
        set((s) => ({
          offerPresets: s.offerPresets.filter((p) => p.id !== id || p.builtIn),
        })),

      renameOfferPreset: (id, name) =>
        set((s) => ({
          offerPresets: s.offerPresets.map((p) =>
            p.id === id && !p.builtIn ? { ...p, name: name.trim() || p.name } : p,
          ),
        })),

      undo: () =>
        set((s) => {
          const last = s.past[s.past.length - 1];
          if (!last) return {};
          return {
            brand: last.brand,
            slides: last.slides,
            past: s.past.slice(0, -1),
            future: [snapshot(s.brand, s.slides), ...s.future],
            activeId: last.slides.find((sl) => sl.id === s.activeId)
              ? s.activeId
              : (last.slides[0]?.id ?? null),
          };
        }),

      redo: () =>
        set((s) => {
          const next = s.future[0];
          if (!next) return {};
          return {
            brand: next.brand,
            slides: next.slides,
            past: [...s.past, snapshot(s.brand, s.slides)],
            future: s.future.slice(1),
            activeId: next.slides.find((sl) => sl.id === s.activeId)
              ? s.activeId
              : (next.slides[0]?.id ?? null),
          };
        }),

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,
    }),
    {
      name: "carousel-brand-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // SSR safety: don't auto-rehydrate on server. We call rehydrate() in __root.tsx on the client.
      skipHydration: true,
      // NOTA: 'brand' NON è qui — il brand è ora per-progetto (campo
      // projects.brand su Supabase) e viene caricato dal builder al mount.
      // Persistere brand in localStorage causava drift tra progetti.
      partialize: (s) => ({
        brandPresets: s.brandPresets.filter((p) => !p.builtIn),
        slideCombos: s.slideCombos,
        templateCategoryOrder: s.templateCategoryOrder,
        templatesPerCategory: s.templatesPerCategory,
        lastFontSizeByFieldType: s.lastFontSizeByFieldType,
        strictExport: s.strictExport,
        validationOverlay: s.validationOverlay,
        offerPresets: s.offerPresets.filter((p) => !p.builtIn),
      }),
      merge: (persistedState, currentState) => {
        try {
          const ps = persistedState as
            | Partial<{
                brand: BrandSettings;
                brandPresets: BrandPreset[];
                slideCombos: SlideCombo[];
                templateCategoryOrder: string[];
                templatesPerCategory: Record<string, TemplateId[]>;
                lastFontSizeByFieldType: Record<string, number>;
                strictExport: boolean;
                validationOverlay: boolean;
                offerPresets: OfferPreset[];
              }>
            | undefined;
          const customPresets = Array.isArray(ps?.brandPresets) ? ps!.brandPresets : [];
          const customOfferPresets = Array.isArray(ps?.offerPresets) ? ps!.offerPresets : [];
          const picker = mergePickerState(ps?.templateCategoryOrder, ps?.templatesPerCategory);
          // Filter slide combos referencing unknown templates (defensive against schema drift).
          const knownTemplates = new Set<TemplateId>(
            Object.values(DEFAULT_TEMPLATES_PER_CATEGORY).flat(),
          );
          const safeCombos = (ps?.slideCombos ?? []).filter(
            (c) => c && knownTemplates.has(c.template),
          );
          return {
            ...currentState,
            // brand NON è ripristinato da localStorage — viene caricato dal builder per-progetto.
            brandPresets: [...BUILT_IN_PRESETS, ...customPresets.filter((p) => p && !p.builtIn)],
            slideCombos: safeCombos,
            templateCategoryOrder: picker.templateCategoryOrder,
            templatesPerCategory: picker.templatesPerCategory,
            lastFontSizeByFieldType: ps?.lastFontSizeByFieldType ?? {},
            strictExport: ps?.strictExport ?? true,
            validationOverlay: ps?.validationOverlay ?? true,
            offerPresets: [
              ...BUILT_IN_OFFER_PRESETS,
              ...customOfferPresets.filter((p) => p && !p.builtIn),
            ],
          };
        } catch (e) {
          console.warn("[carousel-store] Rehydrate failed, using clean defaults:", e);
          return currentState;
        }
      },
    },
  ),
);

/** Convenience hook: returns the active language data for a slide. */
export function useSlideViewData(slide: Slide): AnyTemplateData {
  const lang = useCarousel((s) => s.activeLang);
  const def = useCarousel((s) => s.brand.defaultLanguage);
  return getSlideData(slide, lang, def);
}

export type { BrandPreset, PresetTheme };
