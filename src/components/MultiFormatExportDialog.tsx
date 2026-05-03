import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layers, Loader2 } from "lucide-react";
import { useCarousel } from "@/lib/store";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { FORMAT_DIMENSIONS, type Slide, type SlideFormat } from "@/lib/templates";
import { downloadZipFromEntries, type ZipEntry } from "@/lib/export";
import { toast } from "sonner";

const ALL_FORMATS: { id: SlideFormat; label: string; folder: string }[] = [
  { id: "portrait", label: "Portrait 4:5 (1080×1350)", folder: "instagram-portrait" },
  { id: "square", label: "Square 1:1 (1080×1080)", folder: "instagram-square" },
  { id: "story", label: "Story 9:16 (1080×1920)", folder: "instagram-story" },
];

/**
 * Dialog "Esporta tutti i formati": renderizza ogni slide del carosello in
 * più formati (portrait/square/story) e produce un singolo ZIP con
 * sottocartelle dedicate. Per la story, taglia automaticamente: tiene solo
 * cover, hook, CTA (le slide intermedie hanno troppo testo per 9:16).
 */
export function MultiFormatExportDialog({ baseName }: { baseName: string }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<Partial<Record<SlideFormat, boolean>>>({
    portrait: true,
    square: true,
    story: true,
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const slides = useCarousel((s) => s.slides);
  const brand = useCarousel((s) => s.brand);
  const activeLang = useCarousel((s) => s.activeLang);

  // Mappa di refs: chiave = "slideId|format"
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setRef = (id: string, fmt: SlideFormat) => (el: HTMLDivElement | null) => {
    const k = `${id}|${fmt}`;
    if (el) refs.current.set(k, el);
    else refs.current.delete(k);
  };

  // Per la story: filtra le slide tenendo solo le "essenziali" (cover, hook, cta).
  const storyEssentialTemplates = new Set([
    "cover",
    "hook",
    "cta",
    "bignum",
    "stat",
    "quoteBig",
    "imageQuote",
    "poll",
  ]);
  const storySlides = slides.filter((s) => storyEssentialTemplates.has(s.template));

  const slidesByFormat = (fmt: SlideFormat): Slide[] => {
    if (fmt === "story") return storySlides.length > 0 ? storySlides : slides;
    return slides;
  };

  // Reset progress quando si chiude.
  useEffect(() => {
    if (!open) setProgress({ done: 0, total: 0 });
  }, [open]);

  async function handleExport() {
    setExporting(true);
    try {
      const formats = ALL_FORMATS.filter((f) => enabled[f.id]);
      if (formats.length === 0) {
        toast.error("Seleziona almeno un formato");
        setExporting(false);
        return;
      }
      const entries: ZipEntry[] = [];
      for (const f of formats) {
        const list = slidesByFormat(f.id);
        list.forEach((s, i) => {
          const node = refs.current.get(`${s.id}|${f.id}`);
          if (node) {
            entries.push({
              path: `${f.folder}/slide-${(i + 1).toString().padStart(2, "0")}.png`,
              node,
            });
          }
        });
      }
      setProgress({ done: 0, total: entries.length });
      await downloadZipFromEntries(entries, `${baseName}-multiformat`, brand, (done, total) =>
        setProgress({ done, total }),
      );
      toast.success(
        `${entries.length} slide esportate in ${formats.length} formati. Trovi il file ZIP nei tuoi download.`,
      );
      setOpen(false);
    } catch (e) {
      toast.error("Errore durante l'export: " + (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={slides.length === 0}>
          <Layers className="mr-1 h-4 w-4" /> Tutti i formati
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Esporta in tutti i formati</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Genera un singolo ZIP con sottocartelle per ogni formato selezionato. Per la{" "}
          <strong>story 9:16</strong> il sistema tiene solo le slide essenziali (cover, hook,
          CTA, statistiche), le altre verrebbero illeggibili in verticale.
        </p>
        <div className="space-y-2">
          {ALL_FORMATS.map((f) => {
            const list = slidesByFormat(f.id);
            return (
              <Label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={enabled[f.id]}
                  onChange={(e) =>
                    setEnabled((prev) => ({ ...prev, [f.id]: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {list.length} slide{list.length !== 1 ? "" : ""}{" "}
                    {f.id === "story" && list.length < slides.length && (
                      <span className="ml-1 rounded bg-yellow-500/20 px-1 text-[10px] font-medium text-yellow-700">
                        ridotte da {slides.length}
                      </span>
                    )}
                  </div>
                </div>
              </Label>
            );
          })}
        </div>
        {exporting && progress.total > 0 && (
          <div className="text-xs text-muted-foreground">
            Catturo slide… {progress.done}/{progress.total}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            Annulla
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Esporta ZIP
          </Button>
        </div>

        {/* Render off-screen di tutte le slide nei formati selezionati. */}
        {open && (
          <div
            aria-hidden
            style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}
          >
            {ALL_FORMATS.map((f) =>
              enabled[f.id]
                ? slidesByFormat(f.id).map((s, i, arr) => {
                    const dim = FORMAT_DIMENSIONS[f.id];
                    const slideForFmt: Slide = { ...s, format: f.id };
                    return (
                      <div
                        key={`${s.id}-${f.id}`}
                        ref={setRef(s.id, f.id)}
                        style={{ width: dim.w, height: dim.h }}
                      >
                        <SlideRenderer
                          slide={slideForFmt}
                          brand={brand}
                          index={i}
                          total={arr.length}
                          lang={activeLang}
                        />
                      </div>
                    );
                  })
                : null,
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
