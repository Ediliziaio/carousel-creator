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
import { FONT_OPTIONS, type BgPattern, type BorderStyle, type Weight, DEFAULT_BRAND } from "@/lib/templates";
import { langLabel, LANG_NAMES } from "@/lib/i18n";
import { ImageUploadField } from "@/components/ImageUploadField";
import { Settings, X, Star, RotateCcw } from "lucide-react";

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
];

const BORDER_STYLES: { value: BorderStyle; label: string }[] = [
  { value: "none", label: "Nessuno" },
  { value: "thin", label: "Sottile" },
  { value: "thick", label: "Spesso" },
  { value: "dashed", label: "Tratteggiato" },
  { value: "glow", label: "Glow" },
];

const WEIGHTS: Weight[] = [400, 500, 600, 700, 800, 900];

export function BrandSettingsDialog() {
  const [open, setOpen] = useState(false);
  const brand = useCarousel((s) => s.brand);
  const setBrand = useCarousel((s) => s.setBrand);
  const addLanguage = useCarousel((s) => s.addLanguage);
  const removeLanguage = useCarousel((s) => s.removeLanguage);
  const setDefaultLanguage = useCarousel((s) => s.setDefaultLanguage);
  const [newLang, setNewLang] = useState("");

  // Debounced draft for visual settings — collapses rapid changes (color picker,
  // font select, weight changes, effect toggles) into a single undo entry.
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

  // Use draft as the source of truth for inputs so changes feel instant.
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basics">Base</TabsTrigger>
            <TabsTrigger value="colors">Colori</TabsTrigger>
            <TabsTrigger value="typo">Tipografia</TabsTrigger>
            <TabsTrigger value="effects">Effetti</TabsTrigger>
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

            <TabsContent value="effects" className="m-0 space-y-4">
              <div className="space-y-1.5">
                <Label>Pattern sfondo</Label>
                <Select value={b.effects.bgPattern} onValueChange={(v) => setEffect("bgPattern", v as BgPattern)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BG_PATTERNS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bordo slide</Label>
                <Select value={b.effects.borderStyle} onValueChange={(v) => setEffect("borderStyle", v as BorderStyle)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BORDER_STYLES.map((bs) => <SelectItem key={bs.value} value={bs.value}>{bs.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ToggleRow label="Glow accent" desc="Aggiunge un alone luminoso a numeri grandi e accent." checked={b.effects.accentGlow} onChange={(v) => setEffect("accentGlow", v)} />
              <ToggleRow label="Titoli a gradiente" desc="Riempie i titoli con accent → accent secondario." checked={b.effects.textGradient} onChange={(v) => setEffect("textGradient", v)} />
              <ToggleRow label="Effetto film grain" desc="Sottile rumore tipo pellicola." checked={b.effects.grain} onChange={(v) => setEffect("grain", v)} />
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
