import type { Slide, BrandSettings } from "./templates";

export interface CarouselSnapshot {
  brand: BrandSettings;
  slides: Slide[];
}

export const HISTORY_LIMIT = 50;

export function pushSnapshot(past: CarouselSnapshot[], snap: CarouselSnapshot): CarouselSnapshot[] {
  const next = [...past, snap];
  if (next.length > HISTORY_LIMIT) next.shift();
  return next;
}

export function snapshot(brand: BrandSettings, slides: Slide[]): CarouselSnapshot {
  return { brand: structuredClone(brand), slides: structuredClone(slides) };
}
