import { useMemo, useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wand2 } from "lucide-react";
import { useCarousel } from "@/lib/store";
import { getSlideData } from "@/lib/i18n";
import type { Slide } from "@/lib/templates";
import { toast } from "sonner";

type MarketingTpl = "hook" | "offer" | "cta";

interface DraftRow {
  slideId: string;
  slideIndex: number;
  selected: boolean;
  values: Record<string, string>;
}

const FIELDS: Record<MarketingTpl, { key: string; label: string; placeholder: string }[]> = {
  hook: [
    { key: "hook", label: "Hook", placeholder: "Frase shock o curiosa" },
    { key: "subhook", label: "Subhook", placeholder: "Dettaglio o promessa" },
  ],
  offer: [
    { key: "productName", label: "Prodotto", placeholder: "Nome prodotto" },
    { key: "priceNew", label: "Prezzo nuovo", placeholder: "47" },
    { key: "priceOld", label: "Prezzo barrato", placeholder: "97" },
    { key: "urgency", label: "Urgenza", placeholder: "Solo 48h" },
  ],
  cta: [
    { key: "headline", label: "Headline", placeholder: "Titolo CTA" },
    { key: "buttonLabel", label: "Bottone", placeholder: "ACQUISTA ORA →" },
  ],
};

function extractValues(
  slide: Slide,
  lang: string,
  defaultLang: string,
  tpl: MarketingTpl,
): Record<string, string> {
  const data = getSlideData(slide, lang, defaultLang) as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const f of FIELDS[tpl]) {
    const v = data[f.key];
    out[f.key] = typeof v === "string" ? v : "";
  }
  return out;
}

export function HookOfferMicroEditor() {
  const slides = useCarousel((s) => s.slides);
  const activeLang = useCarousel((s) => s.activeLang);
  const defaultLang = useCarousel((s) => s.brand.defaultLanguage);
  const bulkUpdate = useCarousel((s) => s.bulkUpdateMarketingSlides);

  const buckets = useMemo(() => {
    const out: Record<MarketingTpl, { slide: Slide; index: number }[]> = {
      hook: [],
      offer: [],
      cta: [],
    };
    slides.forEach((s, i) => {
      if (s.template === "hook" || s.template === "offer" || s.template === "cta") {
        out[s.template as MarketingTpl].push({ slide: s, index: i });
      }
    });
    return out;
  }, [slides]);

  const totalCount = buckets.hook.length + buckets.offer.length + buckets.cta.length;
  const enabled = totalCount > 0;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MarketingTpl>("hook");
  const [drafts, setDrafts] = useState<Record<MarketingTpl, DraftRow[]>>({
    hook: [],
    offer: [],
    cta: [],
  });
  const [bulkValues, setBulkValues] = useState<Record<MarketingTpl, Record<string, string>>>({
    hook: {},
    offer: {},
    cta: {},
  });

  // Reset drafts when sheet opens
  useEffect(() => {
    if (!open) return;
    const next: Record<MarketingTpl, DraftRow[]> = { hook: [], offer: [], cta: [] };
    (["hook", "offer", "cta"] as MarketingTpl[]).forEach((tpl) => {
      next[tpl] = buckets[tpl].map(({ slide, index }) => ({
        slideId: slide.id,
        slideIndex: index,
        selected: true,
        values: extractValues(slide, activeLang, defaultLang, tpl),
      }));
    });
    setDrafts(next);
    setBulkValues({ hook: {}, offer: {}, cta: {} });
    // Pick first non-empty tab
    const firstNonEmpty = (["hook", "offer", "cta"] as MarketingTpl[]).find(
      (t) => buckets[t].length > 0,
    );
    if (firstNonEmpty) setTab(firstNonEmpty);
  }, [open, buckets, activeLang, defaultLang]);

  const updateRow = (tpl: MarketingTpl, slideId: string, patch: Partial<DraftRow>) => {
    setDrafts((d) => ({
      ...d,
      [tpl]: d[tpl].map((r) =>
        r.slideId === slideId
          ? { ...r, ...patch, values: { ...r.values, ...(patch.values ?? {}) } }
          : r,
      ),
    }));
  };

  const updateRowField = (tpl: MarketingTpl, slideId: string, field: string, value: string) => {
    setDrafts((d) => ({
      ...d,
      [tpl]: d[tpl].map((r) =>
        r.slideId === slideId ? { ...r, values: { ...r.values, [field]: value } } : r,
      ),
    }));
  };

  const applyBulk = (tpl: MarketingTpl, field: string) => {
    const v = bulkValues[tpl][field];
    if (v === undefined || v === "") {
      toast.error("Inserisci un valore da propagare");
      return;
    }
    setDrafts((d) => ({
      ...d,
      [tpl]: d[tpl].map((r) => (r.selected ? { ...r, values: { ...r.values, [field]: v } } : r)),
    }));
    toast.success(`Valore propagato alle slide selezionate`);
  };

  const save = () => {
    const updates: { slideId: string; patch: Record<string, unknown> }[] = [];
    (["hook", "offer", "cta"] as MarketingTpl[]).forEach((tpl) => {
      drafts[tpl].forEach((row) => {
        if (!row.selected) return;
        const original = extractValues(
          slides.find((s) => s.id === row.slideId)!,
          activeLang,
          defaultLang,
          tpl,
        );
        const patch: Record<string, unknown> = {};
        for (const f of FIELDS[tpl]) {
          if (row.values[f.key] !== original[f.key]) {
            patch[f.key] = row.values[f.key];
          }
        }
        if (Object.keys(patch).length > 0) {
          updates.push({ slideId: row.slideId, patch });
        }
      });
    });

    if (updates.length === 0) {
      toast.info("Nessuna modifica da salvare");
      return;
    }
    bulkUpdate(updates);
    toast.success(`Aggiornate ${updates.length} slide`);
    setOpen(false);
  };

  const renderTab = (tpl: MarketingTpl) => {
    const rows = drafts[tpl];
    const fields = FIELDS[tpl];
    if (rows.length === 0) {
      return (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Nessuna slide {tpl} nel carosello
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Applica a tutte le selezionate
          </div>
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center gap-2">
                <Label className="w-24 shrink-0 text-xs">{f.label}</Label>
                <Input
                  value={bulkValues[tpl][f.key] ?? ""}
                  onChange={(e) =>
                    setBulkValues((b) => ({ ...b, [tpl]: { ...b[tpl], [f.key]: e.target.value } }))
                  }
                  placeholder={f.placeholder}
                  className="h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => applyBulk(tpl, f.key)}
                >
                  Applica
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.slideId} className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Checkbox
                  checked={row.selected}
                  onCheckedChange={(v) => updateRow(tpl, row.slideId, { selected: !!v })}
                />
                <div className="text-sm font-medium">
                  Slide {(row.slideIndex + 1).toString().padStart(2, "0")}
                </div>
              </div>
              <div className="space-y-2">
                {fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <Input
                      value={row.values[f.key] ?? ""}
                      onChange={(e) => updateRowField(tpl, row.slideId, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="h-8"
                      disabled={!row.selected}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!enabled}
          title={enabled ? "Modifica testi marketing" : "Aggiungi una slide Hook/Offerta/CTA"}
        >
          <Wand2 className="mr-1 h-4 w-4" /> Hook → Offer
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[480px] overflow-auto">
        <SheetHeader>
          <SheetTitle>Hook → Offer · Editor coerente</SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-sm text-muted-foreground">
          Modifica testi di hook, offerta e CTA in modo coerente. Seleziona le slide a cui applicare
          le modifiche.
        </p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MarketingTpl)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hook">Hook ({buckets.hook.length})</TabsTrigger>
            <TabsTrigger value="offer">Offer ({buckets.offer.length})</TabsTrigger>
            <TabsTrigger value="cta">CTA ({buckets.cta.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="hook" className="mt-4">
            {renderTab("hook")}
          </TabsContent>
          <TabsContent value="offer" className="mt-4">
            {renderTab("offer")}
          </TabsContent>
          <TabsContent value="cta" className="mt-4">
            {renderTab("cta")}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={save}>Salva modifiche</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
