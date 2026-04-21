import { useCarousel } from "@/lib/store";
import { TEMPLATE_META, TEMPLATE_ORDER, type TemplateId } from "@/lib/templates";
import { validateSlide } from "@/lib/validation";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function MiniPreview({ index }: { index: number }) {
  const slide = useCarousel((s) => s.slides[index]);
  const brand = useCarousel((s) => s.brand);
  const lang = useCarousel((s) => s.activeLang);
  const total = useCarousel((s) => s.slides.length);
  if (!slide) return null;
  const scale = 200 / 1080;
  return (
    <div
      className="relative overflow-hidden rounded-md border border-border bg-black"
      style={{ width: 200, height: 250 }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1080, height: 1350 }}>
        <SlideRenderer slide={slide} brand={brand} index={index} total={total} lang={lang} />
      </div>
    </div>
  );
}

function SortableSlide({ slideId, index }: { slideId: string; index: number }) {
  const slides = useCarousel((s) => s.slides);
  const activeId = useCarousel((s) => s.activeId);
  const setActive = useCarousel((s) => s.setActive);
  const removeSlide = useCarousel((s) => s.removeSlide);
  const duplicateSlide = useCarousel((s) => s.duplicateSlide);
  const lang = useCarousel((s) => s.activeLang);
  const defLang = useCarousel((s) => s.brand.defaultLanguage);

  const sl = slides[index];
  const active = sl.id === activeId;
  const invalid = !validateSlide(sl, lang, defLang).valid;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slideId });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
          title="Trascina per riordinare"
          aria-label="Riordina slide"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setActive(sl.id)}
          className={`block flex-1 rounded-md p-1 transition-colors ${active ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"}`}
        >
          <MiniPreview index={index} />
          <div className="mt-1 flex items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              {invalid && (
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                  title="Campi obbligatori mancanti"
                />
              )}
              {(index + 1).toString().padStart(2, "0")} · {TEMPLATE_META[sl.template].label}
            </span>
          </div>
        </button>
      </div>
      <div className="flex justify-end gap-1 pl-6">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateSlide(sl.id)} title="Duplica">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSlide(sl.id)} disabled={slides.length === 1} title="Elimina">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function SlidesSidebar() {
  const slides = useCarousel((s) => s.slides);
  const addSlide = useCarousel((s) => s.addSlide);
  const reorderSlides = useCarousel((s) => s.reorderSlides);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = slides.findIndex((s) => s.id === active.id);
    const to = slides.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    // arrayMove already validated; use store reorder
    void arrayMove;
    reorderSlides(from, to);
  };

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {slides.map((sl, i) => (
              <SortableSlide key={sl.id} slideId={sl.id} index={i} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  );
}
