import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCarousel } from "@/lib/store";
import {
  FONT_OPTIONS,
  type BgPattern,
  type BorderStyle,
  type ShadowStyle,
  type CornerStyle,
  type TitleEffect,
  type DividerStyle,
  type Weight,
  type MarketingBadgeStyle,
  type MarketingGradient,
  type MarketingIconSet,
  DEFAULT_BRAND,
} from "@/lib/templates";
import { langLabel, LANG_NAMES } from "@/lib/i18n";
import { ImageUploadField } from "@/components/ImageUploadField";
import { PresetCard } from "@/components/PresetCard";
import { themeFromBrand } from "@/lib/presets";
import { Settings, X, Star, RotateCcw, Save, Trash, Palette, Wand2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ACCENT_PRESETS = [
  { name: "Ciano", value: "#00E5FF" },
  { name: "Magenta", value: "#B24BF3" },
  { name: "Lime", value: "#A6FF00" },
  { name: "Arancio", value: "#FF7A1A" },
  { name: "Bianco", value: "#FFFFFF" },
];

const BG_PATTERNS: { value: BgPattern; label: string }[] = [
  { value: "none", label: "Nessuno" },
  { value: "dots", label: "Puntini" },
  { value: "grid", label: "Griglia" },
  { value: "noise", label: "Rumore" },
  { value: "gradient-mesh", label: "Mesh gradiente" },
  { value: "gradient-radial", label: "Gradiente radiale" },
  { value: "gradient-conic", label: "Gradiente conico" },
  { value: "blob", label: "Blob (glassmorphism)" },
  { value: "stripes", label: "Strisce diagonali" },
  { value: "waves", label: "Onde" },
];

const BORDER_STYLES: { value: BorderStyle; label: string }[] = [
  { value: "none", label: "Nessuno" },
  { value: "thin", label: "Sottile" },
  { value: "thick", label: "Spesso" },
  { value: "dashed", label: "Tratteggiato" },
  { value: "glow", label: "Glow" },
];

const SHADOWS: { value: ShadowStyle; label: string }[] = [
  { value: "none", label: "Nessuna" },
  { value: "soft", label: "Soft" },
  { value: "hard", label: "Hard (offset)" },
  { value: "colored", label: "Colorata (accent)" },
];

const CORNERS: { value: CornerStyle; label: string }[] = [
  { value: "sharp", label: "Squadrati" },
  { value: "rounded", label: "Arrotondati" },
  { value: "pill", label: "Pill (XL)" },
];

const TITLE_FX: { value: TitleEffect; label: string }[] = [
  { value: "none", label: "Nessuno" },
  { value: "outline", label: "Contorno" },
  { value: "shadow-3d", label: "Ombra 3D" },
  { value: "underline-accent", label: "Underline accent" },
  { value: "highlight-block", label: "Highlight a blocco" },
];

const DIVIDERS: { value: DividerStyle; label: string }[] = [
  { value: "line", label: "Linea" },
  { value: "dots", label: "Puntini" },
  { value: "wave", label: "Onda" },
  { value: "gradient", label: "Gradiente" },
];

const WEIGHTS: Weight[] = [400, 500, 600, 700, 800, 900];

const MKT_BADGE: { value: MarketingBadgeStyle; label: string }[] = [
  { value: "filled", label: "Pieno" },
  { value: "outline", label: "Contorno" },
  { value: "neon", label: "Neon" },
];
const MKT_GRAD: { value: MarketingGradient; label: string }[] = [
  { value: "none", label: "Nessuno" },
  { value: "subtle", label: "Sottile" },
  { value: "bold", label: "Marcato" },
];
const MKT_ICO: { value: MarketingIconSet; label: string }[] = [
  { value: "emoji", label: "Emoji" },
  { value: "geometric", label: "Geometrico" },
  { value: "minimal", label: "Minimale" },
];

export function BrandSettingsDialog() {
  const [open, setOpen] = useState(false);
  const brand = useCarousel((s) => s.brand);
  const setBrand = useCarousel((s) => s.setBrand);
  const addLanguage = useCarousel((s) => s.addLanguage);
  const removeLanguage = useCarousel((s) => s.removeLanguage);
  const setDefaultLanguage = useCarousel((s) => s.setDefaultLanguage);
  const brandPresets = useCarousel((s) => s.brandPresets);
  const saveBrandPreset = useCarousel((s) => s.saveBrandPreset);
  const applyBrandPreset = useCarousel((s) => s.applyBrandPreset);
  const deleteBrandPreset = useCarousel((s) => s.deleteBrandPreset);
  const renameBrandPreset = useCarousel((s) => s.renameBrandPreset);
  const resetBrandToDefault = useCarousel((s) => s.resetBrandToDefault);

  const [newLang, setNewLang] = useState("");
  const [presetName, setPresetName] = useState("");

  // Debounced draft for visual settings — collapses rapid changes into a single undo entry.
  const [brandDraft, setBrandDraft] = useState(brand);
  const draftRef = useRef(brandDraft);
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    setBrandDraft(brand);
    draftRef.current = brand;
  }, [brand]);

  const setDraft = (patch: Partial<typeof brand>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setBrandDraft(next);
  };

  // Commit draft 400ms after the last change.
  useEffect(() => {
    const t = setTimeout(() => {
      if (draftRef.current !== brand) {
        skipNextSync.current = true;
        setBrand(draftRef.current);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [brandDraft, brand, setBrand]);

  // Flush pending draft when the dialog closes.
  useEffect(() => {
    if (open) return;
    if (draftRef.current !== brand) {
      skipNextSync.current = true;
      setBrand(draftRef.current);
    }
  }, [open, brand, setBrand]);

  const b = brandDraft;

  const setEffect = <K extends keyof typeof b.effects>(k: K, v: (typeof b.effects)[K]) =>
    setDraft({ effects: { ...b.effects, [k]: v } });

  const reset = () => setDraft({
    accent: DEFAULT_BRAND.accent,
    accentSecondary: DEFAULT_BRAND.accentSecondary,
    textColor: DEFAULT_BRAND.textColor,
    bgColor: DEFAULT_BRAND.bgColor,
    fontHeading: DEFAULT_BRAND.fontHeading,
    fontBody: DEFAULT_BRAND.fontBody,
    headingWeight: DEFAULT_BRAND.headingWeight,
    bodyWeight: DEFAULT_BRAND.bodyWeight,
    logoDataUrl: undefined,
    effects: { ...DEFAULT_BRAND.effects },
  });

  const onSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      toast.error("Dai un nome al preset");
      return;
    }
    saveBrandPreset(name);
    setPresetName("");
    toast.success(`Preset "${name}" salvato`);
  };

  const onClearStorage = () => {
    if (!confirm("Cancellare il brand salvato in locale e tornare ai valori di default? I preset custom resteranno.")) return;
    try {
      localStorage.removeItem("carousel-brand-v1");
    } catch {
      /* ignore */
    }
    resetBrandToDefault();
    toast.success("Brand salvato cancellato");
  };

  // Compare current draft theme to each preset to highlight "applied"
  const currentTheme = themeFromBrand(b);
  const isCurrentPreset = (presetTheme: typeof currentTheme) =>
    JSON.stringify(presetTheme) === JSON.stringify(currentTheme);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-1 h-4 w-4" /> Brand
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Impostazioni brand</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basics" className="flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basics">Base</TabsTrigger>
            <TabsTrigger value="colors">Colori</TabsTrigger>
            <TabsTrigger value="typo">Tipografia</TabsTrigger>
            <TabsTrigger value="effects">Effetti</TabsTrigger>
            <TabsTrigger value="presets"><Palette className="mr-1 h-3 w-3" />Preset</TabsTrigger>
            <TabsTrigger value="lang">Lingue</TabsTrigger>
          </TabsList>
          <div className="mt-4 max-h-[60vh] overflow-auto pr-2">
            <TabsContent value="basics" className="m-0 space-y-4">
              <div className="space-y-1.5">
                <Label>Nome brand (header)</Label>
                <Input value={b.brand} onChange={(e) => setDraft({ brand: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Handle (footer)</Label>
                <Input value={b.handle} onChange={(e) => setDraft({ handle: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Footer destro (CTA)</Label>
                <Input value={b.footerCta} onChange={(e) => setDraft({ footerCta: e.target.value })} />
              </div>
              <ImageUploadField
                label="Logo aziendale (opzionale)"
                value={b.logoDataUrl}
                onChange={(url) => setDraft({ logoDataUrl: url })}
                hint="Mostrato accanto al nome brand nell'header. Sfondo trasparente consigliato."
                maxMB={2}
              />
              <div className="rounded-md border border-dashed border-border p-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Le impostazioni del brand vengono salvate automaticamente nel browser e ripristinate al prossimo accesso.
                </div>
                <Button variant="outline" size="sm" onClick={onClearStorage}>
                  <Trash className="mr-1 h-3 w-3" /> Cancella brand salvato
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="m-0 space-y-4">
              <ColorRow label="Colore accent" value={b.accent} onChange={(v) => setDraft({ accent: v })} presets={ACCENT_PRESETS} />
              <ColorRow label="Colore accent secondario" value={b.accentSecondary} onChange={(v) => setDraft({ accentSecondary: v })} presets={ACCENT_PRESETS} />
              <ColorRow label="Colore testo" value={b.textColor} onChange={(v) => setDraft({ textColor: v })} />
              <ColorRow label="Colore sfondo" value={b.bgColor} onChange={(v) => setDraft({ bgColor: v })} />
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-3 w-3" /> Reset valori grafici al default
              </Button>
            </TabsContent>

            <TabsContent value="typo" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Font titoli</Label>
                  <Select value={b.fontHeading} onValueChange={(v) => setDraft({ fontHeading: v as typeof b.fontHeading })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Font body</Label>
                  <Select value={b.fontBody} onValueChange={(v) => setDraft({ fontBody: v as typeof b.fontBody })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Peso titoli</Label>
                  <Select value={String(b.headingWeight)} onValueChange={(v) => setDraft({ headingWeight: Number(v) as Weight })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEIGHTS.map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Peso body</Label>
                  <Select value={String(b.bodyWeight)} onValueChange={(v) => setDraft({ bodyWeight: Number(v) as Weight })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEIGHTS.map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="m-0 space-y-5">
              <Section title="Sfondo">
                <SelectRow
                  label="Pattern sfondo"
                  value={b.effects.bgPattern}
                  options={BG_PATTERNS}
                  onChange={(v) => setEffect("bgPattern", v as BgPattern)}
                />
                <ToggleRow label="Glow accent" desc="Alone luminoso su numeri grandi e accent." checked={b.effects.accentGlow} onChange={(v) => setEffect("accentGlow", v)} />
                <ToggleRow label="Effetto film grain" desc="Sottile rumore tipo pellicola." checked={b.effects.grain} onChange={(v) => setEffect("grain", v)} />
              </Section>

              <Section title="Forme & ombre">
                <SelectRow
                  label="Bordo slide"
                  value={b.effects.borderStyle}
                  options={BORDER_STYLES}
                  onChange={(v) => setEffect("borderStyle", v as BorderStyle)}
                />
                <SelectRow
                  label="Ombre card"
                  value={b.effects.shadow}
                  options={SHADOWS}
                  onChange={(v) => setEffect("shadow", v as ShadowStyle)}
                />
                <SelectRow
                  label="Stile angoli"
                  value={b.effects.cornerStyle}
                  options={CORNERS}
                  onChange={(v) => setEffect("cornerStyle", v as CornerStyle)}
                />
              </Section>

              <Section title="Titoli & decori">
                <ToggleRow label="Titoli a gradiente" desc="Riempie i titoli con accent → accent secondario." checked={b.effects.textGradient} onChange={(v) => setEffect("textGradient", v)} />
                <SelectRow
                  label="Effetto titoli"
                  value={b.effects.titleEffect}
                  options={TITLE_FX}
                  onChange={(v) => setEffect("titleEffect", v as TitleEffect)}
                />
                <SelectRow
                  label="Stile divisori"
                  value={b.effects.dividerStyle}
                  options={DIVIDERS}
                  onChange={(v) => setEffect("dividerStyle", v as DividerStyle)}
                />
                <ToggleRow label="Icon accent secondario" desc="Colora marker numerici con accent secondario." checked={b.effects.iconAccent} onChange={(v) => setEffect("iconAccent", v)} />
              </Section>
            </TabsContent>

            <TabsContent value="presets" className="m-0 space-y-4">
              <div className="rounded-md border border-border p-3">
                <Label className="text-xs uppercase tracking-wider">Salva preset corrente</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Nome del preset (es. Mio brand 2025)"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSavePreset()}
                  />
                  <Button onClick={onSavePreset} disabled={!presetName.trim()}>
                    <Save className="mr-1 h-3 w-3" /> Salva
                  </Button>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Cattura colori, font, pesi ed effetti correnti. Logo e testi non vengono salvati.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {brandPresets.map((p) => (
                  <PresetCard
                    key={p.id}
                    preset={p}
                    isCurrent={isCurrentPreset(p.theme)}
                    onApply={() => {
                      // Flush draft first so preset doesn't get overwritten by debounced commit
                      if (draftRef.current !== brand) {
                        skipNextSync.current = true;
                        setBrand(draftRef.current);
                      }
                      applyBrandPreset(p.id);
                      toast.success(`Preset "${p.name}" applicato`);
                    }}
                    onRename={p.builtIn ? undefined : (name) => renameBrandPreset(p.id, name)}
                    onDelete={p.builtIn ? undefined : () => {
                      if (confirm(`Eliminare il preset "${p.name}"?`)) {
                        deleteBrandPreset(p.id);
                        toast.success("Preset eliminato");
                      }
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lang" className="m-0 space-y-4">
              <p className="text-xs text-muted-foreground">
                Aggiungi le lingue del carosello. Modifica i contenuti per ogni lingua dal pannello Form.
              </p>
              <div className="flex flex-wrap gap-2">
                {brand.languages.map((l) => (
                  <div key={l} className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${l === brand.defaultLanguage ? "border-primary" : "border-border"}`}>
                    <button type="button" title="Imposta come predefinita" onClick={() => setDefaultLanguage(l)} className="text-muted-foreground hover:text-foreground">
                      <Star className={`h-3.5 w-3.5 ${l === brand.defaultLanguage ? "fill-primary text-primary" : ""}`} />
                    </button>
                    <span>{langLabel(l)} <span className="text-xs text-muted-foreground">({l})</span></span>
                    {brand.languages.length > 1 && (
                      <button type="button" onClick={() => removeLanguage(l)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="codice lingua (es. en)"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value.toLowerCase().slice(0, 5))}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const code = newLang.trim();
                    if (!code) return;
                    addLanguage(code);
                    setNewLang("");
                  }}
                  disabled={!newLang.trim() || brand.languages.includes(newLang.trim())}
                >
                  Aggiungi
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(LANG_NAMES).filter((c) => !brand.languages.includes(c)).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => addLanguage(c)}
                    className="rounded-full border border-border px-2 py-0.5 text-xs hover:bg-muted"
                  >
                    + {langLabel(c)}
                  </button>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SelectRow<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorRow({
  label, value, onChange, presets,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: { name: string; value: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-16 cursor-pointer p-1" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
      {presets && (
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            >
              <span className="h-4 w-4 rounded-full" style={{ background: p.value }} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label, desc, checked, onChange,
}: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
