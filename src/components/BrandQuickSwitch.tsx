import { useCarousel } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Check } from "lucide-react";
import type { BrandPreset } from "@/lib/presets";

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

  const isActivePreset = (p: BrandPreset) =>
    p.theme.accent.toLowerCase() === brand.accent.toLowerCase() &&
    p.theme.bgColor.toLowerCase() === brand.bgColor.toLowerCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Cambia palette brand (1 click)">
          <Palette className="mr-1 h-4 w-4" /> Brand
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-3" align="end">
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
        <p className="mt-3 text-[10px] text-muted-foreground">
          Cambia solo la palette colori. Per font, effetti, logo usa il bottone{" "}
          <strong>Brand avanzato</strong>.
        </p>
      </PopoverContent>
    </Popover>
  );
}
