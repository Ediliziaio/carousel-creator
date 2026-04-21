import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCarousel } from "@/lib/store";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import {
  TEMPLATE_META,
  FORMAT_DIMENSIONS,
  makeDefaultSlide,
  type TemplateId,
  type SlideFormat,
} from "@/lib/templates";
import { Plus, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFormat?: SlideFormat;
  onPick: (template: TemplateId, format: SlideFormat) => void;
}

const CATEGORIES: { id: string; label: string; templates: TemplateId[] }[] = [
  { id: "text",   label: "Testo & Titolo", templates: ["cover", "center", "split", "bignum"] },
  { id: "data",   label: "Liste & Dati",   templates: ["grid2x2", "timeline", "checklist", "stat", "compare"] },
  { id: "ref",    label: "Riferimento",    templates: ["vocab", "qa"] },
];

const FORMAT_ORDER: SlideFormat[] = ["portrait", "square", "story", "landscape"];

function FormatCard({ format, selected, onClick }: { format: SlideFormat; selected: boolean; onClick: () => void }) {
  const dim = FORMAT_DIMENSIONS[format];
  // Visual ratio box, max 90px in either dimension
  const max = 90;
  const w = dim.w >= dim.h ? max : Math.round((dim.w / dim.h) * max);
  const h = dim.h >= dim.w ? max : Math.round((dim.h / dim.w) * max);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      }`}
    >
      <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center">
        <div
          className={`rounded-sm border-2 ${selected ? "border-primary bg-primary/10" : "border-muted-foreground/40 bg-muted"}`}
          style={{ width: w, height: h }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{dim.label}</span>
          {selected && <Check className="h-3.5 w-3.5 text-primary" />}
        </div>
        <div className="text-xs text-muted-foreground">{dim.ratio} · {dim.w}×{dim.h}</div>
        <div className="text-xs text-muted-foreground">{dim.desc}</div>
      </div>
    </button>
  );
}

function TemplateThumb({ template, format, selected, onClick }: {
  template: TemplateId;
  format: SlideFormat;
  selected: boolean;
  onClick: () => void;
}) {
  const brand = useCarousel((s) => s.brand);
  const dim = FORMAT_DIMENSIONS[format];
  const slide = useMemo(() => makeDefaultSlide(template, format), [template, format]);

  // Thumbnail target ~140px wide, preserving ratio
  const targetW = 140;
  const scale = targetW / dim.w;
  const thumbH = Math.round(dim.h * scale);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      }`}
    >
      <div
        className="relative overflow-hidden rounded-md bg-black mx-auto"
        style={{ width: targetW, height: thumbH }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: dim.w, height: dim.h }}>
          <SlideRenderer slide={slide} brand={brand} index={0} total={1} lang={brand.defaultLanguage} />
        </div>
      </div>
      <div className="px-1">
        <div className="flex items-center gap-1 text-xs font-medium">
          {selected && <Check className="h-3 w-3 text-primary" />}
          {TEMPLATE_META[template].label}
        </div>
        <div className="text-[11px] leading-tight text-muted-foreground line-clamp-2">{TEMPLATE_META[template].desc}</div>
      </div>
    </button>
  );
}

export function NewSlideDialog({ open, onOpenChange, defaultFormat = "portrait", onPick }: Props) {
  const [format, setFormat] = useState<SlideFormat>(defaultFormat);
  const [template, setTemplate] = useState<TemplateId>("split");
  const [tab, setTab] = useState<string>("text");

  const handleCreate = () => {
    onPick(template, format);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Nuova slide
          </DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-[280px_1fr] gap-0 overflow-hidden">
          <aside className="space-y-2 overflow-auto border-r border-border bg-muted/20 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formato</div>
            {FORMAT_ORDER.map((f) => (
              <FormatCard key={f} format={f} selected={format === f} onClick={() => setFormat(f)} />
            ))}
          </aside>

          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-border px-4 pt-3">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  {CATEGORIES.map((c) => (
                    <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <Tabs value={tab} onValueChange={setTab}>
                {CATEGORIES.map((c) => (
                  <TabsContent key={c.id} value={c.id} className="mt-0">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                      {c.templates.map((t) => (
                        <TemplateThumb
                          key={t}
                          template={t}
                          format={format}
                          selected={template === t}
                          onClick={() => setTemplate(t)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/10 px-6 py-3">
          <div className="mr-auto text-xs text-muted-foreground">
            {FORMAT_DIMENSIONS[format].label} · {TEMPLATE_META[template].label}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-1 h-4 w-4" /> Crea slide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
