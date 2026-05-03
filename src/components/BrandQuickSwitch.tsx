import { useCarousel } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Check, Sparkles } from "lucide-react";
import type { BrandPreset } from "@/lib/presets";
import type { BgPattern } from "@/lib/templates";

const BG_PATTERNS: { id: BgPattern; label: string; preview: string }[] = [
  { id: "none", label: "Pulito", preview: "—" },
  { id: "dots", label: "Punti", preview: "· · ·" },
  { id: "grid", label: "Griglia", preview: "▦" },
  { id: "noise", label: "Texture", preview: "▒" },
  { id: "gradient-mesh", label: "Mesh", preview: "◐" },
  { id: "gradient-radial", label: "Radiale", preview: "◯" },
  { id: "gradient-conic", label: "Conico", preview: "◑" },
  { id: "blob", label: "Blob", preview: "✺" },
  { id: "stripes", label: "Strisce", preview: "▥" },
  { id: "waves", label: "Onde", preview: "〰" },
];

/**
 * Selettore rapido di palette brand. Click sul bottone "Brand" → popover
 * con 5-6 swatch grandi che applicano la palette in 1 click.
 *
 * Differenza con BrandSettingsDialog: questo è il pannello "veloce" (1
 * click), il dialog completo resta per editing avanzato di font, effetti,
 * lingue, ecc.
 */
export function BrandQuickSwitch() {
  const brand = useCarousel((s) => s.brand);
  const brandPresets = useCarousel((s) => s.brandPresets);
  const applyBrandPreset = useCarousel((s) => s.applyBrandPreset);
  const setBrand = useCarousel((s) => s.setBrand);

  const isActivePreset = (p: BrandPreset) =>
    p.theme.accent.toLowerCase() === brand.accent.toLowerCase() &&
    p.theme.bgColor.toLowerCase() === brand.bgColor.toLowerCase();

  const setBgPattern = (pattern: BgPattern) =>
    setBrand({ effects: { ...brand.effects, bgPattern: pattern } });

  const toggleEffect = <K extends keyof typeof brand.effects>(key: K) =>
    setBrand({ effects: { ...brand.effects, [key]: !brand.effects[key] } });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Cambia palette brand (1 click)">
          <Palette className="mr-1 h-4 w-4" /> Brand
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-3" align="end">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Palette rapide
        </div>
        <div className="grid grid-cols-2 gap-2">
          {brandPresets.map((p) => {
            const active = isActivePreset(p);
            return (
              <button
                key={p.id}
                onClick={() => applyBrandPreset(p.id)}
                className={`relative flex items-center gap-2 rounded-md border p-2 text-left transition hover:bg-muted ${
                  active ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border">
                  <span style={{ background: p.theme.bgColor }} className="flex-1" />
                  <span style={{ background: p.theme.accent }} className="flex-1" />
                  <span style={{ background: p.theme.accentSecondary }} className="flex-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium leading-tight">{p.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {p.theme.accent} · {p.theme.bgColor}
                  </div>
                </div>
                {active && (
                  <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" />
                )}
              </button>
            );
          })}
        </div>
        <div className="my-3 h-px bg-border" />

        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sfondo
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {BG_PATTERNS.map((p) => {
            const active = brand.effects.bgPattern === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setBgPattern(p.id)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-md border px-1.5 py-2 text-center transition hover:bg-muted ${
                  active ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
                title={p.label}
              >
                <div className="text-base leading-none">{p.preview}</div>
                <div className="text-[9px] leading-tight text-muted-foreground">
                  {p.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Effetti
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => toggleEffect("accentGlow")}
            className={`rounded-md border px-2 py-1.5 text-left text-xs transition hover:bg-muted ${
              brand.effects.accentGlow
                ? "border-primary bg-primary/5 font-medium"
                : "border-border"
            }`}
          >
            <Sparkles className="mr-1 inline h-3 w-3" />
            Accent glow
          </button>
          <button
            type="button"
            onClick={() => toggleEffect("textGradient")}
            className={`rounded-md border px-2 py-1.5 text-left text-xs transition hover:bg-muted ${
              brand.effects.textGradient
                ? "border-primary bg-primary/5 font-medium"
                : "border-border"
            }`}
          >
            🌈 Text gradient
          </button>
          <button
            type="button"
            onClick={() => toggleEffect("grain")}
            className={`rounded-md border px-2 py-1.5 text-left text-xs transition hover:bg-muted ${
              brand.effects.grain
                ? "border-primary bg-primary/5 font-medium"
                : "border-border"
            }`}
          >
            🎞 Grana film
          </button>
          <button
            type="button"
            onClick={() => toggleEffect("iconAccent")}
            className={`rounded-md border px-2 py-1.5 text-left text-xs transition hover:bg-muted ${
              brand.effects.iconAccent
                ? "border-primary bg-primary/5 font-medium"
                : "border-border"
            }`}
          >
            ✨ Icone accent
          </button>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground">
          Per font, ombre, bordi, lingue usa il bottone <strong>Avanzato</strong>.
        </p>
      </PopoverContent>
    </Popover>
  );
}
