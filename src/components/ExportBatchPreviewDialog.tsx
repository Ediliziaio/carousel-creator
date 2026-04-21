import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCarousel } from "@/lib/store";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { validateSlide } from "@/lib/validation";
import {
  downloadZipFromEntries,
  ensureFontsFor,
  fontsReadyFor,
  type ZipEntry,
} from "@/lib/export";
import { langLabel } from "@/lib/i18n";
import { FORMAT_DIMENSIONS } from "@/lib/templates";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Download, Loader2, Check, AlertTriangle, X, Package, GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandTitle: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "carosello";
}

interface ThumbnailProps {
  slideId: string;
  index: number;
  selected: boolean;
  onToggle: () => void;
  invalid: boolean;
  lang: string;
}

function Thumbnail({ slideId, index, selected, onToggle, invalid, lang }: ThumbnailProps) {
  const slide = useCarousel((s) => s.slides.find((x) => x.id === slideId));
  const brand = useCarousel((s) => s.brand);
  const total = useCarousel((s) => s.slides.length);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slideId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (!slide) return null;
  const fmt = slide.format ?? "portrait";
  const dim = FORMAT_DIMENSIONS[fmt];
  const targetW = 180;
  const scale = targetW / dim.w;
  const thumbH = Math.round(dim.h * scale);

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className={`group relative overflow-hidden rounded-md border-2 transition-colors ${
          selected ? "border-primary" : "border-border opacity-60"
        } ${invalid ? "ring-2 ring-destructive" : ""}`}
        style={{ width: targetW, height: thumbH }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: dim.w, height: dim.h }}>
          <SlideRenderer slide={slide} brand={brand} index={index} total={total} lang={lang} />
        </div>
        {!selected && (
          <div className="pointer-events-none absolute inset-0 bg-background/60" />
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 cursor-grab rounded bg-background/80 p-1 text-foreground shadow active:cursor-grabbing"
          title="Trascina per riordinare"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="absolute right-1 top-1 rounded bg-background/80 p-1 shadow">
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </div>
        <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider shadow">
          {(index + 1).toString().padStart(2, "0")} · {dim.ratio}
        </div>
        {invalid && (
          <div className="absolute bottom-1 right-1 rounded bg-destructive p-1 text-destructive-foreground shadow" title="Errori di validazione">
            <AlertTriangle className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ExportBatchPreviewDialog({ open, onOpenChange, brandTitle }: Props) {
  const slides = useCarousel((s) => s.slides);
  const brand = useCarousel((s) => s.brand);
  const reorderSlides = useCarousel((s) => s.reorderSlides);
  const setActiveLang = useCarousel((s) => s.setActiveLang);
  const activeLang = useCarousel((s) => s.activeLang);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLangs, setSelectedLangs] = useState<string[]>([brand.defaultLanguage]);
  const [folderPerLang, setFolderPerLang] = useState(true);
  const [renumber, setRenumber] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [assetsReady, setAssetsReady] = useState(false);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set(slides.map((s) => s.id)));
    setSelectedLangs([activeLang]);
    setProgress({ done: 0, total: 0 });
  }, [open, slides, activeLang]);

  // Preload fonts on open
  useEffect(() => {
    if (!open) return;
    setAssetsReady(false);
    let cancelled = false;
    (async () => {
      await ensureFontsFor(brand);
      if (!cancelled) setAssetsReady(fontsReadyFor(brand));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, brand]);

  const captureRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setCaptureRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) captureRefs.current.set(key, el);
    else captureRefs.current.delete(key);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = slides.findIndex((s) => s.id === active.id);
    const to = slides.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    reorderSlides(from, to);
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedSlides = useMemo(
    () => slides.filter((s) => selectedIds.has(s.id)),
    [slides, selectedIds],
  );

  const validationIssues = useMemo(
    () =>
      selectedSlides.flatMap((s, i) => {
        const v = validateSlide(s, selectedLangs[0], brand.defaultLanguage);
        return v.valid ? [] : [{ index: slides.findIndex((x) => x.id === s.id), errors: v.errors.length, id: s.id }];
        void i;
      }),
    [selectedSlides, selectedLangs, brand.defaultLanguage, slides],
  );

  const isMulti = brand.languages.length > 1;
  const total = selectedSlides.length * selectedLangs.length;

  const onDownload = async () => {
    if (selectedSlides.length === 0 || selectedLangs.length === 0) return;
    setBusy(true);
    setProgress({ done: 0, total });

    try {
      // Render each lang sequentially: switch lang, wait for re-render, snapshot DOM nodes
      const entries: ZipEntry[] = [];
      for (const lng of selectedLangs) {
        setActiveLang(lng);
        await new Promise((r) => setTimeout(r, 80));
        await ensureFontsFor(brand);

        for (let i = 0; i < selectedSlides.length; i++) {
          const sl = selectedSlides[i];
          const node = captureRefs.current.get(`${lng}-${sl.id}`);
          if (!node) continue;
          const originalIdx = slides.findIndex((x) => x.id === sl.id);
          const num = (renumber ? i + 1 : originalIdx + 1).toString().padStart(2, "0");
          const filename = `slide-${num}.png`;
          const path =
            isMulti && (folderPerLang || selectedLangs.length > 1) ? `${lng}/${filename}` : filename;
          entries.push({ path, node });
        }
      }

      const method = await downloadZipFromEntries(
        entries,
        `${slugify(brandTitle)}`,
        brand,
        (done, t) => setProgress({ done, total: t }),
      );
      toast.success(`${entries.length} PNG esportate in ZIP`);
      if (method === "new-tab") {
        toast.info("Download bloccato dal browser: file aperto in una nuova tab.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("Errore export: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const allSelected = selectedIds.size === slides.length;
  const noneSelected = selectedIds.size === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Anteprima export ZIP — {selectedSlides.length} di {slides.length} slide
            {selectedLangs.length > 1 && ` · ${selectedLangs.length} lingue`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-6 py-3 text-sm">
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(allSelected ? new Set() : new Set(slides.map((s) => s.id)))}>
            {allSelected ? "Deseleziona tutte" : "Seleziona tutte"}
          </Button>

          {isMulti && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lingue:</span>
              {brand.languages.map((l) => {
                const checked = selectedLangs.includes(l);
                return (
                  <label key={l} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) =>
                        setSelectedLangs((prev) =>
                          c
                            ? Array.from(new Set([...prev, l]))
                            : prev.length > 1
                              ? prev.filter((x) => x !== l)
                              : prev,
                        )
                      }
                    />
                    {langLabel(l)}
                  </label>
                );
              })}
            </div>
          )}

          {!isMulti && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lingua:</span>
              <Select
                value={selectedLangs[0] ?? brand.defaultLanguage}
                onValueChange={(v) => setSelectedLangs([v])}
              >
                <SelectTrigger className="h-7 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {brand.languages.map((l) => (
                    <SelectItem key={l} value={l}>{langLabel(l)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="ml-auto flex items-center gap-1 text-xs">
            <Checkbox checked={renumber} onCheckedChange={(c) => setRenumber(!!c)} />
            Rinumera consecutivamente
          </label>
          {isMulti && selectedLangs.length > 1 && (
            <label className="flex items-center gap-1 text-xs">
              <Checkbox checked={folderPerLang} onCheckedChange={(c) => setFolderPerLang(!!c)} />
              Una cartella per lingua
            </label>
          )}
        </div>

        <div className="max-h-[55vh] overflow-auto bg-[#1a1a1a] p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                {slides.map((s, i) => (
                  <Thumbnail
                    key={s.id}
                    slideId={s.id}
                    index={i}
                    selected={selectedIds.has(s.id)}
                    onToggle={() => toggle(s.id)}
                    invalid={!validateSlide(s, selectedLangs[0], brand.defaultLanguage).valid}
                    lang={selectedLangs[0] ?? brand.defaultLanguage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border px-6 py-3 sm:flex-row sm:items-center">
          <div className="mr-auto text-xs text-muted-foreground">
            {validationIssues.length > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" /> {validationIssues.length} slide con campi mancanti
              </span>
            )}
            {assetsReady ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <Check className="h-3 w-3" /> Asset pronti · {total} PNG da generare
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Caricamento font...
              </span>
            )}
            {busy && progress.total > 0 && (
              <span className="ml-2">— {progress.done}/{progress.total}</span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            <X className="mr-1 h-4 w-4" /> Annulla
          </Button>
          <Button onClick={onDownload} disabled={busy || noneSelected || selectedLangs.length === 0 || !assetsReady}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            Scarica ZIP
          </Button>
        </DialogFooter>

        {/* Hidden capture nodes — one per (lang, slide) */}
        <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, width: 1080, height: 1350, pointerEvents: "none" }}>
          {selectedLangs.flatMap((lng) =>
            selectedSlides.map((sl) => {
              const idx = slides.findIndex((x) => x.id === sl.id);
              return (
                <div key={`${lng}-${sl.id}`} ref={setCaptureRef(`${lng}-${sl.id}`)} style={{ width: 1080, height: 1350 }}>
                  <SlideRenderer slide={sl} brand={brand} index={idx} total={slides.length} lang={lng} />
                </div>
              );
            }),
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
