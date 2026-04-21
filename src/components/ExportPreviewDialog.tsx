import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCarousel } from "@/lib/store";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { validateSlide } from "@/lib/validation";
import { downloadSinglePng, ensureFontsFor, fontsReadyFor } from "@/lib/export";
import { langLabel } from "@/lib/i18n";
import { TEMPLATE_META, FORMAT_DIMENSIONS } from "@/lib/templates";
import { Download, AlertCircle, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandTitle: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "carosello";
}

export function ExportPreviewDialog({ open, onOpenChange, brandTitle }: Props) {
  const slides = useCarousel((s) => s.slides);
  const activeId = useCarousel((s) => s.activeId);
  const brand = useCarousel((s) => s.brand);
  const lang = useCarousel((s) => s.activeLang);
  const setActive = useCarousel((s) => s.setActive);

  const slideIndex = slides.findIndex((s) => s.id === activeId);
  const slide = slideIndex >= 0 ? slides[slideIndex] : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [busy, setBusy] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);

  const fmt = slide?.format ?? "portrait";
  const dim = FORMAT_DIMENSIONS[fmt];

  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const sx = (rect.width - 16) / dim.w;
      const sy = (rect.height - 16) / dim.h;
      setScale(Math.max(0.05, Math.min(sx, sy)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, dim.w, dim.h]);

  // Preload fonts + check images for the dialog so preview matches export.
  useEffect(() => {
    if (!open) return;
    setAssetsReady(false);
    let cancelled = false;
    (async () => {
      await ensureFontsFor(brand);
      // Wait a tick for capture node images to mount
      await new Promise((r) => setTimeout(r, 50));
      const node = captureRef.current;
      if (node) {
        const imgs = Array.from(node.querySelectorAll("img"));
        await Promise.all(
          imgs.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
          ),
        );
      }
      if (!cancelled && fontsReadyFor(brand)) setAssetsReady(true);
      else if (!cancelled) {
        // retry once more after a beat
        setTimeout(() => !cancelled && setAssetsReady(fontsReadyFor(brand)), 300);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, brand, slide]);

  if (!slide) return null;

  const validation = validateSlide(slide, lang, brand.defaultLanguage);
  const num = (slideIndex + 1).toString().padStart(2, "0");
  const langSuffix = brand.languages.length > 1 ? `-${lang}` : "";
  const filename = `${slugify(brandTitle)}-slide-${num}${langSuffix}.png`;

  const onDownload = async () => {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      const method = await downloadSinglePng(captureRef.current, filename, brand);
      toast.success("PNG esportata");
      if (method === "new-tab") {
        toast.info("Download bloccato dal browser: file aperto in una nuova tab.");
      }
    } catch (e) {
      toast.error("Errore export: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const focusFirstError = () => {
    if (validation.errors[0]) {
      setActive(slide.id);
      onOpenChange(false);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("slide:focus-field", {
            detail: { slideId: slide.id, field: validation.errors[0].field },
          }),
        );
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Anteprima export — Slide {num}</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[70vh] grid-cols-[1fr_280px]">
          <div ref={containerRef} className="relative flex items-center justify-center overflow-hidden bg-[#1a1a1a] p-4">
            <div style={{ width: 1080 * scale, height: 1350 * scale, position: "relative" }}>
              <div
                style={{
                  width: 1080,
                  height: 1350,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  boxShadow: "0 40px 80px rgba(0,0,0,.45)",
                }}
              >
                <SlideRenderer slide={slide} brand={brand} index={slideIndex} total={slides.length} lang={lang} />
              </div>
            </div>
          </div>
          <div className="space-y-3 overflow-auto border-l border-border bg-card p-4 text-sm">
            <Info label="Template" value={TEMPLATE_META[slide.template].label} />
            <Info label="Risoluzione" value="1080 × 1350 px" />
            <Info label="Lingua" value={langLabel(lang)} />
            <Info label="File" value={filename} mono />
            <Info label="Brand" value={brand.brand} />
            {brand.logoDataUrl && <Info label="Logo" value="Sì" />}
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Asset</div>
              {assetsReady ? (
                <div className="mt-1 flex items-center gap-1 text-sm text-emerald-500">
                  <Check className="h-3.5 w-3.5" /> Font e immagini pronti
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Caricamento font...
                </div>
              )}
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Validazione</div>
              {validation.valid ? (
                <div className="mt-1 text-sm text-emerald-500">✓ Tutti i campi sono compilati</div>
              ) : (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {validation.errors.length} errori
                  </div>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {validation.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>• {e.message}</li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full" onClick={focusFirstError}>
                    Vai al primo errore
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            <X className="mr-1 h-4 w-4" /> Annulla
          </Button>
          <Button onClick={onDownload} disabled={busy || !assetsReady}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            {assetsReady ? "Scarica questa PNG" : "Caricamento font..."}
          </Button>
        </DialogFooter>
        {/* Hidden full-size capture node — what actually gets exported */}
        <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, width: 1080, height: 1350, pointerEvents: "none" }}>
          <div ref={captureRef} style={{ width: 1080, height: 1350 }}>
            <SlideRenderer slide={slide} brand={brand} index={slideIndex} total={slides.length} lang={lang} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono break-all" : ""}`}>{value}</div>
    </div>
  );
}
