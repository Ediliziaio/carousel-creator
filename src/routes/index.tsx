import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCarousel } from "@/lib/store";
import { SlidesSidebar } from "@/components/SlidesSidebar";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideEditorForm } from "@/components/SlideEditorForm";
import { JsonEditor } from "@/components/JsonEditor";
import { BrandSettingsDialog } from "@/components/BrandSettingsDialog";
import { ExportButton } from "@/components/ExportButton";
import { ExportErrorBanner } from "@/components/ExportErrorBanner";
import { ExportPreviewDialog } from "@/components/ExportPreviewDialog";
import { ExportBatchPreviewDialog } from "@/components/ExportBatchPreviewDialog";
import { CarouselPresetDialog } from "@/components/CarouselPresetDialog";
import { QuickOfferEditor } from "@/components/QuickOfferEditor";
import { ContentImportDialog } from "@/components/ContentImportDialog";
import { HookOfferMicroEditor } from "@/components/HookOfferMicroEditor";
import { FixIssuesGuide, type FlatIssue } from "@/components/FixIssuesGuide";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, FileJson, Undo2, Redo2, Eye, LayoutGrid, Copy, ShieldCheck, ShieldOff, AlertTriangle } from "lucide-react";
import { FORMAT_DIMENSIONS } from "@/lib/templates";
import { validateAllSlides } from "@/lib/validation";
import { langLabel } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Carousel Generator — multi-formato PNG" },
      { name: "description", content: "Crea caroselli Instagram con template editoriali, multilingua e export PNG in 4 formati." },
    ],
  }),
  component: Index,
});

function Index() {
  const slides = useCarousel((s) => s.slides);
  const activeId = useCarousel((s) => s.activeId);
  const brand = useCarousel((s) => s.brand);
  const setBrand = useCarousel((s) => s.setBrand);
  const loadJSON = useCarousel((s) => s.loadJSON);
  const undo = useCarousel((s) => s.undo);
  const redo = useCarousel((s) => s.redo);
  const past = useCarousel((s) => s.past);
  const future = useCarousel((s) => s.future);
  const activeLang = useCarousel((s) => s.activeLang);
  const setActiveLang = useCarousel((s) => s.setActiveLang);
  const duplicateSlide = useCarousel((s) => s.duplicateSlide);
  const setActive = useCarousel((s) => s.setActive);
  const strictExport = useCarousel((s) => s.strictExport);
  const validationOverlay = useCarousel((s) => s.validationOverlay);
  const setValidationOverlay = useCarousel((s) => s.setValidationOverlay);

  const activeIndex = useMemo(() => slides.findIndex((s) => s.id === activeId), [slides, activeId]);
  const activeSlide = activeIndex >= 0 ? slides[activeIndex] : null;

  const validationIssues = useMemo(
    () => validateAllSlides(slides, activeLang, brand.defaultLanguage),
    [slides, activeLang, brand.defaultLanguage],
  );

  const flatIssues: FlatIssue[] = useMemo(
    () =>
      validationIssues.flatMap((v) =>
        v.errors.map((e) => ({
          slideId: v.slideId,
          slideIndex: v.slideIndex,
          templateLabel: v.templateLabel,
          field: e.field,
          message: e.message,
          severity: e.severity,
        })),
      ),
    [validationIssues],
  );

  const jumpToIssue = (issue: FlatIssue | undefined) => {
    if (!issue) return;
    setActive(issue.slideId);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("slide:focus-field", {
          detail: { slideId: issue.slideId, field: issue.field },
        }),
      );
    }, 60);
  };

  const goToFirstError = () => jumpToIssue(flatIssues[0]);

  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  const startGuide = () => {
    if (flatIssues.length === 0) return;
    setGuideOpen(true);
    setGuideIndex(0);
    jumpToIssue(flatIssues[0]);
  };

  // Clamp guide index when issues list shrinks; auto-close on completion
  useEffect(() => {
    if (!guideOpen) return;
    if (flatIssues.length === 0) {
      setGuideOpen(false);
      toast.success("Tutti i campi sono completi ✔");
      return;
    }
    if (guideIndex >= flatIssues.length) {
      const ni = flatIssues.length - 1;
      setGuideIndex(ni);
      jumpToIssue(flatIssues[ni]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatIssues.length, guideOpen]);

  const [editorTab, setEditorTab] = useState<string>("form");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setEditorTab("form");
    window.addEventListener("slide:focus-field", handler);
    return () => window.removeEventListener("slide:focus-field", handler);
  }, []);

  // Keyboard shortcuts: ⌘Z / ⌘⇧Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // Inject Google Fonts dynamically based on selected fonts
  useEffect(() => {
    const id = "carousel-google-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const families = new Set(["Figtree:wght@400;500;600;700;800;900", "JetBrains Mono:wght@400;500;700"]);
    const w = "wght@400;500;600;700;800;900";
    [brand.fontHeading, brand.fontBody].forEach((f) => {
      if (f === "Figtree" || f === "JetBrains Mono") return;
      families.add(`${f}:${w}`);
    });
    link.href = "https://fonts.googleapis.com/css2?" + Array.from(families).map((f) => "family=" + f.replace(/ /g, "+")).join("&") + "&display=swap";
  }, [brand.fontHeading, brand.fontBody]);

  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setExportRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) exportRefs.current.set(id, el);
    else exportRefs.current.delete(id);
  };

  const [exportError, setExportError] = useState<string | null>(null);

  const onExportJson = () => {
    const json = JSON.stringify({ brand, slides }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(brand.carouselTitle)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.brand || !Array.isArray(parsed.slides)) throw new Error("Formato non valido");
        loadJSON(parsed);
        toast.success("Carosello importato");
      } catch (e) {
        toast.error("JSON non valido: " + (e as Error).message);
      }
    };
    input.click();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary" />
          <span className="font-semibold">Carousel Generator</span>
        </div>
        <Input
          value={brand.carouselTitle}
          onChange={(e) => setBrand({ carouselTitle: e.target.value })}
          className="ml-2 h-8 max-w-xs"
          placeholder="Titolo carosello"
        />

        <div className="ml-2 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={past.length === 0} title="Annulla (⌘Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={future.length === 0} title="Ripeti (⌘⇧Z)">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {brand.languages.length > 1 && (
          <Select value={activeLang} onValueChange={setActiveLang}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {brand.languages.map((l) => (
                <SelectItem key={l} value={l}>{langLabel(l)}{l === brand.defaultLanguage && " ★"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <CarouselPresetDialog />
          <QuickOfferEditor />
          <HookOfferMicroEditor />
          <ContentImportDialog />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setValidationOverlay(!validationOverlay)}
            title={validationOverlay ? "Nascondi indicatori validazione" : "Mostra indicatori validazione"}
          >
            {validationOverlay ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldOff className="h-4 w-4" />}
          </Button>
          <BrandSettingsDialog />
          <Button variant="outline" size="sm" onClick={onImportJson}>
            <Upload className="mr-1 h-4 w-4" /> Import JSON
          </Button>
          <Button variant="outline" size="sm" onClick={onExportJson}>
            <FileJson className="mr-1 h-4 w-4" /> Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!activeSlide) return;
              duplicateSlide(activeSlide.id);
              toast.success("Slide duplicata");
            }}
            disabled={!activeSlide}
            title="Duplica slide attiva"
          >
            <Copy className="mr-1 h-4 w-4" /> Duplica
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} disabled={!activeSlide}>
            <Eye className="mr-1 h-4 w-4" /> Anteprima
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBatchOpen(true)} disabled={slides.length === 0}>
            <LayoutGrid className="mr-1 h-4 w-4" /> Anteprima ZIP
          </Button>
          <ExportButton
            exportRefs={exportRefs}
            activeSlideId={activeSlide?.id ?? null}
            activeIndex={activeIndex}
            brandTitle={brand.carouselTitle}
            onError={setExportError}
          />
        </div>
      </header>

      {exportError && (
        <ExportErrorBanner message={exportError} onDismiss={() => setExportError(null)} />
      )}

      {validationIssues.length > 0 && (
        <div
          role="alert"
          className={`flex items-start gap-3 border-b px-4 py-2 text-sm ${
            strictExport
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">
              {validationIssues.length} {validationIssues.length === 1 ? "slide ha" : "slide hanno"} campi obbligatori mancanti
              {strictExport && " — Export disabilitato"}
            </div>
            <div className="text-xs opacity-90">
              {strictExport
                ? "Completa i campi obbligatori per riabilitare l'esportazione."
                : "Strict export disattivato: l'esportazione resta possibile."}
            </div>
          </div>
          <Button variant="default" size="sm" className="h-7 shrink-0" onClick={startGuide}>
            Correggi campi mancanti
          </Button>
          <Button variant="outline" size="sm" className="h-7 shrink-0" onClick={goToFirstError}>
            Vai al primo errore
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <SlidesSidebar />

        <main className="relative flex flex-1 items-center justify-center overflow-auto bg-[#1a1a1a] p-6">
          {activeSlide ? (
            (() => {
              const dim = FORMAT_DIMENSIONS[activeSlide.format ?? "portrait"];
              return (
                <ScaledPreview key={activeSlide.id + activeLang} w={dim.w} h={dim.h}>
                  <SlideRenderer slide={activeSlide} brand={brand} index={activeIndex} total={slides.length} lang={activeLang} showValidation={validationOverlay} />
                </ScaledPreview>
              );
            })()
          ) : (
            <div className="text-muted-foreground">Nessuna slide selezionata</div>
          )}
        </main>

        <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-card">
          {activeSlide ? (
            <Tabs value={editorTab} onValueChange={setEditorTab} className="flex h-full flex-col">
              <div className="border-b border-border p-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Form</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <TabsContent value="form" className="mt-0">
                  <SlideEditorForm slide={activeSlide} />
                </TabsContent>
                <TabsContent value="json" className="mt-0">
                  <JsonEditor slide={activeSlide} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="p-4 text-muted-foreground">Seleziona una slide.</div>
          )}
        </aside>
      </div>

      <div
        aria-hidden
        style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}
      >
        {slides.map((s, i) => {
          const dim = FORMAT_DIMENSIONS[s.format ?? "portrait"];
          return (
            <div key={s.id} ref={setExportRef(s.id)} style={{ width: dim.w, height: dim.h }}>
              <SlideRenderer slide={s} brand={brand} index={i} total={slides.length} lang={activeLang} />
            </div>
          );
        })}
      </div>

      <ExportPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} brandTitle={brand.carouselTitle} />
      <ExportBatchPreviewDialog open={batchOpen} onOpenChange={setBatchOpen} brandTitle={brand.carouselTitle} />
    </div>
  );
}

function ScaledPreview({ children, w = 1080, h = 1350 }: { children: React.ReactNode; w?: number; h?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const sx = (rect.width - 32) / w;
      const sy = (rect.height - 32) / h;
      setScale(Math.max(0.05, Math.min(sx, sy)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center">
      <div style={{ width: w * scale, height: h * scale, position: "relative" }}>
        <div
          style={{
            width: w,
            height: h,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            boxShadow: "0 40px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "carosello";
}
