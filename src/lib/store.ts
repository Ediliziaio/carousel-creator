import { create } from "zustand";
import {
  type Slide,
  type TemplateId,
  type BrandSettings,
  DEFAULT_BRAND,
  makeDefaultSlide,
} from "./templates";

interface CarouselState {
  brand: BrandSettings;
  slides: Slide[];
  activeId: string | null;
  setBrand: (b: Partial<BrandSettings>) => void;
  addSlide: (template: TemplateId) => void;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  updateSlide: (id: string, data: Slide["data"]) => void;
  reorderSlides: (from: number, to: number) => void;
  setActive: (id: string) => void;
  loadJSON: (json: { brand: BrandSettings; slides: Slide[] }) => void;
}

const initial1 = makeDefaultSlide("split");
const initial2 = makeDefaultSlide("center");

export const useCarousel = create<CarouselState>((set) => ({
  brand: DEFAULT_BRAND,
  slides: [initial1, initial2],
  activeId: initial1.id,
  setBrand: (b) => set((s) => ({ brand: { ...s.brand, ...b } })),
  addSlide: (template) =>
    set((s) => {
      const slide = makeDefaultSlide(template);
      return { slides: [...s.slides, slide], activeId: slide.id };
    }),
  removeSlide: (id) =>
    set((s) => {
      const slides = s.slides.filter((sl) => sl.id !== id);
      const activeId =
        s.activeId === id ? (slides[0]?.id ?? null) : s.activeId;
      return { slides, activeId };
    }),
  duplicateSlide: (id) =>
    set((s) => {
      const idx = s.slides.findIndex((sl) => sl.id === id);
      if (idx === -1) return s;
      const copy: Slide = {
        ...s.slides[idx],
        id: crypto.randomUUID(),
        data: structuredClone(s.slides[idx].data),
      };
      const slides = [...s.slides];
      slides.splice(idx + 1, 0, copy);
      return { slides, activeId: copy.id };
    }),
  updateSlide: (id, data) =>
    set((s) => ({
      slides: s.slides.map((sl) => (sl.id === id ? { ...sl, data } : sl)),
    })),
  reorderSlides: (from, to) =>
    set((s) => {
      const slides = [...s.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      return { slides };
    }),
  setActive: (id) => set({ activeId: id }),
  loadJSON: (json) =>
    set({
      brand: json.brand,
      slides: json.slides,
      activeId: json.slides[0]?.id ?? null,
    }),
}));
