import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { BUILT_IN_CAROUSEL_PRESETS } from "@/lib/carouselPresets";
import { TEMPLATE_META } from "@/lib/templates";
import { useCarousel } from "@/lib/store";
import { toast } from "sonner";

export function CarouselPresetDialog() {
  const [open, setOpen] = useState(false);
  const loadCarouselPreset = useCarousel((s) => s.loadCarouselPreset);
  const appendCarouselPreset = useCarousel((s) => s.appendCarouselPreset);
  const slides = useCarousel((s) => s.slides);

  const onReplace = (id: string, name: string) => {
    if (
      slides.length > 0 &&
      !confirm(`Sostituire tutte le ${slides.length} slide attuali con il preset "${name}"?`)
    )
      return;
    loadCarouselPreset(id);
    toast.success(`Preset "${name}" caricato`);
    setOpen(false);
  };

  const onAppend = (id: string, name: string) => {
    appendCarouselPreset(id);
    toast.success(`Preset "${name}" aggiunto in coda`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-1 h-4 w-4" /> Caroselli pronti
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Caroselli pronti — preset marketing</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {BUILT_IN_CAROUSEL_PRESETS.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{p.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.slides.length} slide
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.slides.map((s, i) => (
                  <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {i + 1}. {TEMPLATE_META[s.template].label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onReplace(p.id, p.name)}>
                  Sostituisci tutto
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAppend(p.id, p.name)}>
                  Aggiungi alla fine
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
