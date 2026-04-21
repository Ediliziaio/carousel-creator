import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Check, Save, X, RotateCcw, GripVertical, Bookmark } from "lucide-react";
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
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFormat?: SlideFormat;
  onPick: (template: TemplateId, format: SlideFormat) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  text: "Testo & Titolo",
  data: "Liste & Dati",
  ref: "Riferimento",
};

const FORMAT_ORDER: SlideFormat[] = ["portrait", "square", "story", "landscape"];

function FormatCard({ format, selected, onClick }: { format: SlideFormat; selected: boolean; onClick: () => void }) {
  const dim = FORMAT_DIMENSIONS[format];
  const max = 64;
  const w = dim.w >= dim.h ? max : Math.round((dim.w / dim.h) * max);
  const h = dim.h >= dim.w ? max : Math.round((dim.h / dim.w) * max);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      }`}
    >
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center">
        <div
          className={`rounded-sm border-2 ${selected ? "border-primary bg-primary/10" : "border-muted-foreground/40 bg-muted"}`}
          style={{ width: w, height: h }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{dim.label}</span>
          {selected && <Check className="h-3.5 w-3.5 text-primary" />}
        </div>
        <div className="text-[11px] text-muted-foreground">{dim.ratio} · {dim.w}×{dim.h}</div>
      </div>
    </button>
  );
}

function SortableTemplateThumb({ template, format, selected, onClick }: {
  template: TemplateId;
  format: SlideFormat;
  selected: boolean;
  onClick: () => void;
}) {
  const brand = useCarousel((s) => s.brand);
  const dim = FORMAT_DIMENSIONS[format];
  const slide = useMemo(() => makeDefaultSlide(template, format), [template, format]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: template });

  const targetW = 140;
  const scale = targetW / dim.w;
  const thumbH = Math.round(dim.h * scale);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute right-1 top-1 z-10 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
        title="Trascina per riordinare"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onClick} className="flex w-full flex-col gap-2 text-left">
        <div
          className="relative mx-auto overflow-hidden rounded-md bg-black"
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
          <div className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{TEMPLATE_META[template].desc}</div>
        </div>
      </button>
    </div>
  );
}

function SortableTabTrigger({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TabsTrigger value={id} className="cursor-grab active:cursor-grabbing">{label}</TabsTrigger>
    </div>
  );
}

export function NewSlideDialog({ open, onOpenChange, defaultFormat = "portrait", onPick }: Props) {
  const [format, setFormat] = useState<SlideFormat>(defaultFormat);
  const [template, setTemplate] = useState<TemplateId>("split");
  const [tab, setTab] = useState<string>("text");
  const [comboName, setComboName] = useState("");
  const [showComboInput, setShowComboInput] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const slideCombos = useCarousel((s) => s.slideCombos);
  const saveSlideCombo = useCarousel((s) => s.saveSlideCombo);
  const deleteSlideCombo = useCarousel((s) => s.deleteSlideCombo);
  const categoryOrder = useCarousel((s) => s.templateCategoryOrder);
  const templatesPerCategory = useCarousel((s) => s.templatesPerCategory);
  const setTemplateCategoryOrder = useCarousel((s) => s.setTemplateCategoryOrder);
  const setTemplatesForCategory = useCarousel((s) => s.setTemplatesForCategory);
  const resetPickerOrder = useCarousel((s) => s.resetPickerOrder);

  // Keep tab valid if categories change
  useEffect(() => {
    if (categoryOrder.length > 0 && !categoryOrder.includes(tab)) {
      setTab(categoryOrder[0]);
    }
  }, [categoryOrder, tab]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleCreate = () => {
    onPick(template, format);
    onOpenChange(false);
  };

  const handleSaveCombo = () => {
    const name = comboName.trim() || `${TEMPLATE_META[template].label} · ${FORMAT_DIMENSIONS[format].ratio}`;
    saveSlideCombo(name, template, format);
    setComboName("");
    setShowComboInput(false);
  };

  const onCategoriesDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = categoryOrder.indexOf(String(e.active.id));
    const newIdx = categoryOrder.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    setTemplateCategoryOrder(arrayMove(categoryOrder, oldIdx, newIdx));
  };

  const onTemplatesDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const list = templatesPerCategory[tab] ?? [];
    const oldIdx = list.indexOf(e.active.id as TemplateId);
    const newIdx = list.indexOf(e.over.id as TemplateId);
    if (oldIdx < 0 || newIdx < 0) return;
    setTemplatesForCategory(tab, arrayMove(list, oldIdx, newIdx));
  };

  const currentTemplates = templatesPerCategory[tab] ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Nuova slide
          </DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-[280px_1fr] gap-0 overflow-hidden">
          <aside className="space-y-4 overflow-auto border-r border-border bg-muted/20 p-4">
            {/* Combos */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Bookmark className="h-3 w-3" /> I miei combo
              </div>
              {slideCombos.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground">
                  Salva le tue combinazioni preferite per riusarle.
                </p>
              ) : (
                <div className="space-y-1">
                  {slideCombos.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-center gap-1 rounded-md border border-border bg-background p-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => { setTemplate(c.template); setFormat(c.format); }}
                        className="flex-1 truncate text-left text-xs"
                        title={`Applica: ${TEMPLATE_META[c.template].label} · ${FORMAT_DIMENSIONS[c.format].ratio}`}
                      >
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {TEMPLATE_META[c.template].label} · {FORMAT_DIMENSIONS[c.format].ratio}
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteSlideCombo(c.id)}
                        title="Elimina combo"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {showComboInput ? (
                <div className="flex gap-1">
                  <Input
                    autoFocus
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveCombo(); if (e.key === "Escape") setShowComboInput(false); }}
                    placeholder="Nome combo"
                    className="h-7 text-xs"
                  />
                  <Button type="button" size="sm" className="h-7 px-2" onClick={handleSaveCombo}>OK</Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setShowComboInput(true)}
                >
                  <Save className="mr-1 h-3 w-3" /> Salva combo corrente
                </Button>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formato</div>
              {FORMAT_ORDER.map((f) => (
                <FormatCard key={f} format={f} selected={format === f} onClick={() => setFormat(f)} />
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-border px-4 pt-3">
              <Tabs value={tab} onValueChange={setTab}>
                {mounted ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoriesDragEnd}>
                    <SortableContext items={categoryOrder} strategy={horizontalListSortingStrategy}>
                      <TabsList>
                        {categoryOrder.map((cId) => (
                          <SortableTabTrigger key={cId} id={cId} label={CATEGORY_LABELS[cId] ?? cId} />
                        ))}
                      </TabsList>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <TabsList>
                    {categoryOrder.map((cId) => (
                      <TabsTrigger key={cId} value={cId}>{CATEGORY_LABELS[cId] ?? cId}</TabsTrigger>
                    ))}
                  </TabsList>
                )}
              </Tabs>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <Tabs value={tab} onValueChange={setTab}>
                {categoryOrder.map((cId) => (
                  <TabsContent key={cId} value={cId} className="mt-0">
                    {mounted ? (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTemplatesDragEnd}>
                        <SortableContext items={cId === tab ? currentTemplates : (templatesPerCategory[cId] ?? [])} strategy={rectSortingStrategy}>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                            {(templatesPerCategory[cId] ?? []).map((t) => (
                              <SortableTemplateThumb
                                key={t}
                                template={t}
                                format={format}
                                selected={template === t}
                                onClick={() => setTemplate(t)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                        {(templatesPerCategory[cId] ?? []).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTemplate(t)}
                            className={`rounded-lg border p-2 text-left text-xs ${template === t ? "border-primary" : "border-border"}`}
                          >
                            {TEMPLATE_META[t].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/10 px-6 py-3">
          <Button type="button" variant="ghost" size="sm" className="mr-auto text-xs" onClick={resetPickerOrder} title="Ripristina ordine default">
            <RotateCcw className="mr-1 h-3 w-3" /> Ripristina ordine
          </Button>
          <div className="text-xs text-muted-foreground">
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
