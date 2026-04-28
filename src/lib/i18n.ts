import type { Slide, AnyTemplateData, I18nWrapper, SlideDataField } from "./templates";

export const LANG_NAMES: Record<string, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

export function langLabel(code: string): string {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

export function isI18n(d: SlideDataField): d is I18nWrapper {
  return typeof d === "object" && d !== null && (d as I18nWrapper).__i18n === true;
}

/** Returns the data for the requested language with fallback to defaultLanguage, then any first lang. */
export function getSlideData(slide: Slide, lang: string, defaultLang: string): AnyTemplateData {
  if (!isI18n(slide.data)) return slide.data as AnyTemplateData;
  const w = slide.data;
  return w.byLang[lang] ?? w.byLang[defaultLang] ?? Object.values(w.byLang)[0];
}

/** Sets data for a given language in the slide. Always returns a new SlideDataField. */
export function setSlideData(
  current: SlideDataField,
  lang: string,
  next: AnyTemplateData,
  defaultLang: string,
): SlideDataField {
  if (!isI18n(current)) {
    // single-lang format. Keep single if writing into defaultLang, otherwise migrate.
    if (lang === defaultLang) return next;
    return {
      __i18n: true,
      byLang: { [defaultLang]: current as AnyTemplateData, [lang]: next },
    };
  }
  return { ...current, byLang: { ...current.byLang, [lang]: next } };
}

/** Migrate a single-lang slide to i18n keyed by current default language. */
export function ensureI18n(current: SlideDataField, defaultLang: string): I18nWrapper {
  if (isI18n(current)) return current;
  return { __i18n: true, byLang: { [defaultLang]: current as AnyTemplateData } };
}
