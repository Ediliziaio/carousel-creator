import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";
import { useCarousel } from "@/lib/store";
import { TEMPLATE_META } from "@/lib/templates";
import { toast } from "sonner";

export function QuickOfferEditor() {
  const slides = useCarousel((s) => s.slides);
  const propagate = useCarousel((s) => s.propagateOfferFields);

  const targets = useMemo(
    () => slides.map((s, i) => ({ s, i })).filter(({ s }) => s.template === "offer" || s.template === "cta"),
    [slides],
  );
  const enabled = targets.length > 0;

  const [open, setOpen] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("");
  const [priceNew, setPriceNew] = useState("");
  const [priceOld, setPriceOld] = useState("");
  const [currency, setCurrency] = useState("");
  const [urgency, setUrgency] = useState("");
  const [overwrite, setOverwrite] = useState(false);

  const apply = () => {
    const patch: Parameters<typeof propagate>[0] = {};
    if (ctaLabel.trim()) patch.ctaLabel = ctaLabel.trim();
    if (priceNew.trim()) patch.priceNew = priceNew.trim();
    if (priceOld.trim()) patch.priceOld = priceOld.trim();
    if (currency.trim()) patch.currency = currency.trim();
    if (urgency.trim()) patch.urgency = urgency.trim();
    if (Object.keys(patch).length === 0) {
      toast.error("Compila almeno un campo");
      return;
    }
    const r = propagate(patch, { overwriteCustom: overwrite });
    toast.success(`Aggiornate ${r.offerCount} offerte e ${r.ctaCount} CTA`);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={!enabled} title={enabled ? "" : "Aggiungi una slide Offerta o CTA"}>
          <Zap className="mr-1 h-4 w-4" /> Offerta rapida
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] overflow-auto">
        <SheetHeader>
          <SheetTitle>Offerta rapida</SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-sm text-muted-foreground">
          Imposta i campi in un colpo solo: vengono propagati a tutte le slide Offerta e CTA del carosello.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>CTA (testo bottone)</Label>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Es. ACQUISTA ORA →" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prezzo nuovo</Label>
              <Input value={priceNew} onChange={(e) => setPriceNew(e.target.value)} placeholder="Es. 147" />
            </div>
            <div className="space-y-1.5">
              <Label>Prezzo barrato</Label>
              <Input value={priceOld} onChange={(e) => setPriceOld(e.target.value)} placeholder="Es. 297" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valuta</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="€" />
          </div>
          <div className="space-y-1.5">
            <Label>Urgenza</Label>
            <Input value={urgency} onChange={(e) => setUrgency(e.target.value)} placeholder="Es. Solo per i primi 50 — scade in 48h" />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="text-sm">
              <div className="font-medium">Sovrascrivi anche se personalizzato</div>
              <div className="text-xs text-muted-foreground">Se OFF, modifica solo i valori a default.</div>
            </div>
            <Switch checked={overwrite} onCheckedChange={setOverwrite} />
          </div>
        </div>

        <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slide impattate</div>
          {targets.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessuna slide Offerta/CTA</div>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {targets.map(({ s, i }) => (
                <li key={s.id}>
                  Slide {(i + 1).toString().padStart(2, "0")} · {TEMPLATE_META[s.template].label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={apply}>Applica a tutte</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
