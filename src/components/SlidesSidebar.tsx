import { useEffect, useMemo, useState } from "react";
import { useCarousel } from "@/lib/store";
import {
  TEMPLATE_META,
  FORMAT_DIMENSIONS,
  type TemplateId,
  type SlideFormat,
} from "@/lib/templates";
import { validateSlide, validateAllSlides } from "@/lib/validation";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { NewSlideDialog } from "@/components/NewSlideDialog";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Copy,
  Trash2,
  GripVertical,
  AlertTriangle,
  Sparkles,
  Wand2,
  PlusSquare,
} from "lucide-react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const THUMB_W = 200;

function MiniPreview({ index }: { index: number }) {
  const slide = useCarousel((s) => s.slides[index]);
  const brand = useCarousel((s) => s.brand);
  const lang = useCarousel((s) => s.activeLang);
  const total = useCarousel((s) => s.slides.length);
  if (!slide) return null;
  const fmt = slide.format ?? "portrait";
  const dim = FORMAT_DIMENSIONS[fmt];
  const scale = THUMB_W / dim.w;
  const h = Math.round(dim.h * scale);
  return (
    <div
      className="relative overflow-hidden rounded-md border border-border bg-black"
      style={{ width: THUMB_W, height: h }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: dim.w,
          height: dim.h,
        }}
      >
        <SlideRenderer slide={slide} brand={brand} index={index} total={total} lang={lang} />
      </div>
    </div>
  );
}

interface SlideRowProps {
  slideId: string;
  index: number;
  draggable: boolean;
}

function SlideRow({ slideId, index, draggable }: SlideRowProps) {
  const slides = useCarousel((s) => s.slides);
  const activeId = useCarousel((s) => s.activeId);
  const setActive = useCarousel((s) => s.setActive);
  const removeSlide = useCarousel((s) => s.removeSlide);
  const duplicateSlide = useCarousel((s) => s.duplicateSlide);
  const lang = useCarousel((s) => s.activeLang);
  const defLang = useCarousel((s) => s.brand.defaultLanguage);

  const sortable = useSortable({ id: slideId, disabled: !draggable });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const sl = slides[index];
  if (!sl) return null;
  const active = sl.id === activeId;
  const validation = validateSlide(sl, lang, defLang);
  const errorCount = validation.errors.filter((e) => (e.severity ?? "error") === "error").length;
  const fmt = sl.format ?? "portrait";
  const ratio = FORMAT_DIMENSIONS[fmt].ratio;

  const style: React.CSSProperties = draggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : {};

  return (
    <div ref={draggable ? setNodeRef : undefined} style={style} className="space-y-1">
      <div className="flex items-stretch gap-1">
        {draggable ? (
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
        ) : (
          <div className="w-5" />
        )}
        <button
          type="button"
          onClick={() => setActive(sl.id)}
          className={`block flex-1 rounded-md p-1 transition-colors ${active ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"}`}
        >
          <MiniPreview index={index} />
          <div className="mt-1 flex items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              {errorCount > 0 && (
                <span
                  className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground"
                  title={validation.errors.map((e) => `• ${e.message}`).join("\n")}
                >
                  {errorCount}
                </span>
              )}
              {(index + 1).toString().padStart(2, "0")} · {TEMPLATE_META[sl.template].label}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
              {ratio}
            </span>
          </div>
        </button>
      </div>
      <div className="flex justify-end gap-1 pl-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => duplicateSlide(sl.id)}
          title="Duplica"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => removeSlide(sl.id)}
          disabled={slides.length === 1}
          title="Elimina"
        >
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
  const setActive = useCarousel((s) => s.setActive);
  const lang = useCarousel((s) => s.activeLang);
  const defLang = useCarousel((s) => s.brand.defaultLanguage);
  const strictExport = useCarousel((s) => s.strictExport);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastFormat, setLastFormat] = useState<SlideFormat>("portrait");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const issues = useMemo(() => validateAllSlides(slides, lang, defLang), [slides, lang, defLang]);

  const goToFirstError = () => {
    const first = issues[0];
    if (!first) return;
    setActive(first.slideId);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("slide:focus-field", {
          detail: { slideId: first.slideId, field: first.firstField },
        }),
      );
    }, 60);
  };

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
    reorderSlides(from, to);
  };

  const handlePick = (template: TemplateId, format: SlideFormat) => {
    setLastFormat(format);
    addSlide(template, format);
  };

  return (
    <aside className="flex h-[38vh] w-full shrink-0 flex-col border-b border-border bg-card md:h-full md:w-[252px] md:border-b-0 md:border-r">
      <div className="border-b border-border p-3">
        <Button className="w-full" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nuova slide
        </Button>
      </div>
      {strictExport && issues.length > 0 && (
        <button
          type="button"
          onClick={goToFirstError}
          className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-left text-[11px] text-destructive transition-colors hover:bg-destructive/20"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 leading-tight">
            <strong>{issues.length}</strong>{" "}
            {issues.length === 1 ? "slide con errori" : "slide con errori"} — vai al primo
          </span>
        </button>
      )}
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {slides.length === 0 ? (
          <EmptySlidesHint
            onPickTemplate={() => setDialogOpen(true)}
            onOpenPresets={() =>
              window.dispatchEvent(new CustomEvent("builder:open-carousel-presets"))
            }
            onOpenTextImport={() =>
              window.dispatchEvent(new CustomEvent("builder:open-text-import"))
            }
          />
        ) : mounted ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {slides.map((sl, i) => (
                <SlideRow key={sl.id} slideId={sl.id} index={i} draggable />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          slides.map((sl, i) => (
            <SlideRow key={sl.id} slideId={sl.id} index={i} draggable={false} />
          ))
        )}
      </div>
      <NewSlideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultFormat={lastFormat}
        onPick={handlePick}
      />
    </aside>
  );
}

function EmptySlidesHint({
  onPickTemplate,
  onOpenPresets,
  onOpenTextImport,
}: {
  onPickTemplate: () => void;
  onOpenPresets: () => void;
  onOpenTextImport: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-background/40 p-3 text-center">
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        Da dove vuoi partire?
      </p>
      <button
        type="button"
        onClick={onOpenTextImport}
        className="group flex items-start gap-2 rounded-md border border-border bg-card p-2 text-left transition hover:border-primary hover:bg-primary/5"
      >
        <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-xs font-semibold leading-tight">Da testo / brief</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            Incolla un testo, ottieni 5-10 slide
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onOpenPresets}
        className="group flex items-start gap-2 rounded-md border border-border bg-card p-2 text-left transition hover:border-primary hover:bg-primary/5"
      >
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-xs font-semibold leading-tight">Da preset</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            Funnel, educational, lead gen
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onPickTemplate}
        className="group flex items-start gap-2 rounded-md border border-border bg-card p-2 text-left transition hover:border-primary hover:bg-primary/5"
      >
        <PlusSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-xs font-semibold leading-tight">Slide singola</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            Scegli un template e parti da zero
          </div>
        </div>
      </button>
    </div>
  );
}
