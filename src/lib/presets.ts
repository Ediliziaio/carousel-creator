import {
  type BrandSettings,
  type BrandEffects,
  type FontChoice,
  type Weight,
  DEFAULT_EFFECTS,
} from "./templates";

/** Visual-only snapshot of a brand: colors, fonts, effects. No logo, texts, languages. */
export interface PresetTheme {
  accent: string;
  accentSecondary: string;
  textColor: string;
  bgColor: string;
  fontHeading: FontChoice;
  fontBody: FontChoice;
  headingWeight: Weight;
  bodyWeight: Weight;
  effects: BrandEffects;
}

export interface BrandPreset {
  id: string;
  name: string;
  createdAt: number;
  builtIn?: boolean;
  theme: PresetTheme;
}

/** Extract the visual theme from a brand. */
export function themeFromBrand(b: BrandSettings): PresetTheme {
  return {
    accent: b.accent,
    accentSecondary: b.accentSecondary,
    textColor: b.textColor,
    bgColor: b.bgColor,
    fontHeading: b.fontHeading,
    fontBody: b.fontBody,
    headingWeight: b.headingWeight,
    bodyWeight: b.bodyWeight,
    effects: { ...b.effects },
  };
}

/** Apply a preset theme on top of the current brand (no-op for non-visual fields). */
export function applyThemeToBrand(b: BrandSettings, t: PresetTheme): BrandSettings {
  return {
    ...b,
    accent: t.accent,
    accentSecondary: t.accentSecondary,
    textColor: t.textColor,
    bgColor: t.bgColor,
    fontHeading: t.fontHeading,
    fontBody: t.fontBody,
    headingWeight: t.headingWeight,
    bodyWeight: t.bodyWeight,
    effects: { ...DEFAULT_EFFECTS, ...t.effects },
  };
}

/** Built-in presets — always available, not deletable. */
export const BUILT_IN_PRESETS: BrandPreset[] = [
  {
    id: "builtin-cyberpunk-cyan",
    name: "Cyberpunk Cyan",
    createdAt: 0,
    builtIn: true,
    theme: {
      accent: "#00E5FF",
      accentSecondary: "#B24BF3",
      textColor: "#F5F5F5",
      bgColor: "#0A0A0A",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
      headingWeight: 800,
      bodyWeight: 400,
      effects: {
        ...DEFAULT_EFFECTS,
        bgPattern: "gradient-mesh",
        accentGlow: true,
        textGradient: true,
        grain: true,
        borderStyle: "glow",
        shadow: "colored",
        cornerStyle: "rounded",
        titleEffect: "shadow-3d",
        dividerStyle: "gradient",
        iconAccent: true,
      },
    },
  },
  {
    id: "builtin-editorial-mono",
    name: "Editorial Mono",
    createdAt: 0,
    builtIn: true,
    theme: {
      accent: "#FFFFFF",
      accentSecondary: "#9CA3AF",
      textColor: "#F5F5F5",
      bgColor: "#111111",
      fontHeading: "Playfair Display",
      fontBody: "Inter",
      headingWeight: 900,
      bodyWeight: 400,
      effects: {
        ...DEFAULT_EFFECTS,
        bgPattern: "none",
        borderStyle: "thin",
        shadow: "soft",
        cornerStyle: "sharp",
        titleEffect: "underline-accent",
        dividerStyle: "line",
        iconAccent: false,
      },
    },
  },
  {
    id: "builtin-sunset-magazine",
    name: "Sunset Magazine",
    createdAt: 0,
    builtIn: true,
    theme: {
      accent: "#FF7A1A",
      accentSecondary: "#FF2E63",
      textColor: "#FFF7EB",
      bgColor: "#1A0F0A",
      fontHeading: "Playfair Display",
      fontBody: "DM Sans",
      headingWeight: 800,
      bodyWeight: 400,
      effects: {
        ...DEFAULT_EFFECTS,
        bgPattern: "gradient-radial",
        accentGlow: true,
        textGradient: true,
        grain: true,
        borderStyle: "none",
        shadow: "colored",
        cornerStyle: "pill",
        titleEffect: "highlight-block",
        dividerStyle: "wave",
        iconAccent: true,
      },
    },
  },
  {
    id: "builtin-brutalist",
    name: "Brutalist B/W",
    createdAt: 0,
    builtIn: true,
    theme: {
      accent: "#FFFFFF",
      accentSecondary: "#FFFFFF",
      textColor: "#FFFFFF",
      bgColor: "#000000",
      fontHeading: "Space Grotesk",
      fontBody: "Space Grotesk",
      headingWeight: 900,
      bodyWeight: 500,
      effects: {
        ...DEFAULT_EFFECTS,
        bgPattern: "stripes",
        accentGlow: false,
        textGradient: false,
        grain: false,
        borderStyle: "thick",
        shadow: "hard",
        cornerStyle: "sharp",
        titleEffect: "outline",
        dividerStyle: "line",
        iconAccent: false,
      },
    },
  },
  {
    id: "builtin-pastel-soft",
    name: "Pastel Soft",
    createdAt: 0,
    builtIn: true,
    theme: {
      accent: "#A78BFA",
      accentSecondary: "#F0ABFC",
      textColor: "#1F1235",
      bgColor: "#FAF5FF",
      fontHeading: "DM Sans",
      fontBody: "DM Sans",
      headingWeight: 700,
      bodyWeight: 400,
      effects: {
        ...DEFAULT_EFFECTS,
        bgPattern: "blob",
        accentGlow: false,
        textGradient: true,
        grain: false,
        borderStyle: "none",
        shadow: "soft",
        cornerStyle: "pill",
        titleEffect: "none",
        dividerStyle: "dots",
        iconAccent: true,
      },
    },
  },
];

export function makePreset(name: string, theme: PresetTheme): BrandPreset {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Preset senza nome",
    createdAt: Date.now(),
    theme,
  };
}
