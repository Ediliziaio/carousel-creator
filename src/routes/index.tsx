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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileJson } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carousel Generator — 1080×1350 PNG" },
      { name: "description", content: "Crea caroselli Instagram con 10 template editoriali ed esporta in PNG 1080×1350." },
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

  const activeIndex = useMemo(() => slides.findIndex((s) => s.id === activeId), [slides, activeId]);
  const activeSlide = activeIndex >= 0 ? slides[activeIndex] : null;

  // Inject Google Fonts once on mount
  useEffect(() => {
    if (document.getElementById("carousel-google-fonts")) return;
    const link = document.createElement("link");
    link.id = "carousel-google-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // Hidden export refs (one per slide, full 1080x1350 size)
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
      {/* Toolbar */}
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
        <div className="ml-auto flex items-center gap-2">
          <BrandSettingsDialog />
          <Button variant="outline" size="sm" onClick={onImportJson}>
            <Upload className="mr-1 h-4 w-4" /> Import JSON
          </Button>
          <Button variant="outline" size="sm" onClick={onExportJson}>
            <FileJson className="mr-1 h-4 w-4" /> Export JSON
          </Button>
          <Button size="sm" variant="secondary" onClick={onExportSingle} disabled={!activeSlide || exporting !== null}>
            {exporting === "single" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            PNG slide
          </Button>
          <Button size="sm" onClick={onExportZip} disabled={slides.length === 0 || exporting !== null}>
            {exporting === "zip" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Package className="mr-1 h-4 w-4" />}
            ZIP ({slides.length})
          </Button>
        </div>
      </header>

      {/* Main 3-col layout */}
      <div className="flex min-h-0 flex-1">
        <SlidesSidebar />

        {/* Center preview */}
        <main className="relative flex flex-1 items-center justify-center overflow-auto bg-[#1a1a1a] p-6">
          {activeSlide ? (
            <ScaledPreview key={activeSlide.id}>
              <SlideRenderer slide={activeSlide} brand={brand} index={activeIndex} total={slides.length} />
            </ScaledPreview>
          ) : (
            <div className="text-muted-foreground">Nessuna slide selezionata</div>
          )}
        </main>

        {/* Right editor */}
        <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-card">
          {activeSlide ? (
            <Tabs defaultValue="form" className="flex h-full flex-col">
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

      {/* Hidden export-size renders (1080x1350) */}
      <div
        aria-hidden
        style={{ position: "fixed", left: -99999, top: 0, width: 1080, height: 1350, pointerEvents: "none" }}
      >
        {slides.map((s, i) => (
          <div key={s.id} ref={setExportRef(s.id)} style={{ width: 1080, height: 1350 }}>
            <SlideRenderer slide={s} brand={brand} index={i} total={slides.length} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScaledPreview({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const sx = (rect.width - 32) / 1080;
      const sy = (rect.height - 32) / 1350;
      setScale(Math.max(0.1, Math.min(sx, sy)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center">
      <div
        style={{
          width: 1080 * scale,
          height: 1350 * scale,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 1080,
            height: 1350,
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
