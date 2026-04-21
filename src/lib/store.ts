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

const DEFAULT_CATEGORY_ORDER = ["text", "data", "ref"];
const DEFAULT_TEMPLATES_PER_CATEGORY: Record<string, TemplateId[]> = {
  text: ["cover", "center", "split", "bignum"],
  data: ["grid2x2", "timeline", "checklist", "stat", "compare"],
  ref:  ["vocab", "qa"],
};

interface CarouselState {
  brand: BrandSettings;
  slides: Slide[];
  activeId: string | null;
  activeLang: string;

  /** All available brand presets (built-in + user). */
  brandPresets: BrandPreset[];

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

  /** Brand presets actions */
  saveBrandPreset: (name: string) => void;
  applyBrandPreset: (id: string) => void;
  deleteBrandPreset: (id: string) => void;
  renameBrandPreset: (id: string, name: string) => void;
  resetBrandToDefault: () => void;

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
      past: [],
      future: [],

      setBrand: (b) =>
        set((s) => withHistory(s, { brand: { ...s.brand, ...b } })),

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
          const activeId =
            s.activeId === id ? (slides[0]?.id ?? null) : s.activeId;
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
            activeLang: (json.brand?.defaultLanguage ?? "it"),
          });
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

      resetBrandToDefault: () =>
        set((s) => withHistory(s, { brand: DEFAULT_BRAND })),

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
      partialize: (s) => ({
        brand: s.brand,
        brandPresets: s.brandPresets.filter((p) => !p.builtIn),
      }),
      merge: (persistedState, currentState) => {
        const ps = persistedState as Partial<{ brand: BrandSettings; brandPresets: BrandPreset[] }> | undefined;
        const customPresets = ps?.brandPresets ?? [];
        return {
          ...currentState,
          brand: mergeBrand(ps?.brand),
          // Always include built-ins first; user presets after.
          brandPresets: [...BUILT_IN_PRESETS, ...customPresets.filter((p) => !p.builtIn)],
        };
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
