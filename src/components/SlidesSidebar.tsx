import { useCarousel } from "@/lib/store";
import { TEMPLATE_META, TEMPLATE_ORDER, type TemplateId } from "@/lib/templates";
import { validateSlide } from "@/lib/validation";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mini preview using transform scale
function MiniPreview({ index }: { index: number }) {
  const slide = useCarousel((s) => s.slides[index]);
  const brand = useCarousel((s) => s.brand);
  const total = useCarousel((s) => s.slides.length);
  if (!slide) return null;
  // Mini = 200x250, scale = 200/1080
  const scale = 200 / 1080;
  return (
    <div
      className="relative overflow-hidden rounded-md border border-border bg-black"
      style={{ width: 200, height: 250 }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1080, height: 1350 }}>
        <SlideRenderer slide={slide} brand={brand} index={index} total={total} />
      </div>
    </div>
  );
}

export function SlidesSidebar() {
  const slides = useCarousel((s) => s.slides);
  const activeId = useCarousel((s) => s.activeId);
  const setActive = useCarousel((s) => s.setActive);
  const addSlide = useCarousel((s) => s.addSlide);
  const removeSlide = useCarousel((s) => s.removeSlide);
  const duplicateSlide = useCarousel((s) => s.duplicateSlide);
  const reorderSlides = useCarousel((s) => s.reorderSlides);

  return (
    <aside className="flex h-full w-[252px] shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Nuova slide
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {TEMPLATE_ORDER.map((t) => (
              <DropdownMenuItem key={t} onClick={() => addSlide(t as TemplateId)}>
                <div className="flex flex-col">
                  <span className="font-medium">{TEMPLATE_META[t].label}</span>
                  <span className="text-xs text-muted-foreground">{TEMPLATE_META[t].desc}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {slides.map((sl, i) => {
          const active = sl.id === activeId;
          const invalid = !validateSlide(sl).valid;
          return (
            <div key={sl.id} className="space-y-1">
              <button
                type="button"
                onClick={() => setActive(sl.id)}
                className={`block w-full rounded-md p-1 transition-colors ${active ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"}`}
              >
                <MiniPreview index={i} />
                <div className="mt-1 flex items-center justify-between gap-2 px-1">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    {invalid && (
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                        title="Campi obbligatori mancanti"
                      />
                    )}
                    {(i + 1).toString().padStart(2, "0")} · {TEMPLATE_META[sl.template].label}
                  </span>
                </div>
              </button>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => reorderSlides(i, i - 1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === slides.length - 1} onClick={() => reorderSlides(i, i + 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateSlide(sl.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSlide(sl.id)} disabled={slides.length === 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
