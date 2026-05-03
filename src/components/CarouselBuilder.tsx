import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCarousel } from "@/lib/store";
import { SlidesSidebar } from "@/components/SlidesSidebar";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideEditorForm } from "@/components/SlideEditorForm";
import { JsonEditor } from "@/components/JsonEditor";
import { BrandSettingsDialog } from "@/components/BrandSettingsDialog";
import { BrandQuickSwitch } from "@/components/BrandQuickSwitch";
import { BulkOperationsDialog } from "@/components/BulkOperationsDialog";
import { MultiFormatExportDialog } from "@/components/MultiFormatExportDialog";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { ContentSwitcher } from "@/components/ContentSwitcher";
import { ExportButton } from "@/components/ExportButton";
import { ExportErrorBanner } from "@/components/ExportErrorBanner";
import { ExportPreviewDialog } from "@/components/ExportPreviewDialog";
import { ExportBatchPreviewDialog } from "@/components/ExportBatchPreviewDialog";
import { CarouselPresetDialog } from "@/components/CarouselPresetDialog";
import { QuickOfferEditor } from "@/components/QuickOfferEditor";
import { ContentImportDialog } from "@/components/ContentImportDialog";
import { HookOfferMicroEditor } from "@/components/HookOfferMicroEditor";
import { FixIssuesGuide, type FlatIssue } from "@/components/FixIssuesGuide";
import { UserMenu } from "@/components/UserMenu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Upload,
  FileJson,
  Undo2,
  Redo2,
  Eye,
  LayoutGrid,
  Copy,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";
import {
  FORMAT_DIMENSIONS,
  DEFAULT_BRAND,
  makeDefaultData,
  makeDefaultSlide,
  type BrandSettings,
  type Slide,
} from "@/lib/templates";
import { validateAllSlides } from "@/lib/validation";
import { langLabel } from "@/lib/i18n";
import { toast } from "sonner";
import {
  getContent,
  saveContent,
  STATUS_META,
  STATUS_ORDER,
  type ContentType,
  type ContentStatus,
} from "@/lib/contentsApi";
import { getProject, updateProject } from "@/lib/projectsApi";
import { captureThumbnail } from "@/lib/export";

interface BuilderProps {
  projectId: string;
  contentId: string;
}

interface ContentDataShape {
  brand?: BrandSettings;
  slides?: Slide[];
  activeLang?: string;
  status?: ContentStatus | "draft";
  publishedAt?: string;
  scheduledAt?: string;
  /** Brief importato da file/incolla — pronto da convertire in slide. */
  brief?: string;
}

/**
 * Garantisce che la slide abbia tutti i campi previsti dal template,
 * mergiandola sopra i default. Difesa contro payload DB legacy o testo
 * importato che lascia buchi (es. hook senza .hook → crash su .length).
 */
/**
 * Deep merge: per ogni campo del default, se l'incoming ha lo stesso campo
 * SI USA l'incoming. Ma se il default è un oggetto (non array) e l'incoming
 * è anche oggetto → merge ricorsivo a 1 livello (basta per i nostri template
 * che hanno al massimo profondità 2: es. problemSolution.problem.label).
 */
function deepMergeWithDefaults(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(incoming)) {
    const v = incoming[k];
    if (v === undefined || v === null) continue;
    const baseV = base[k];
    // Se il default è array e l'incoming non lo è → mantieni default.
    if (Array.isArray(baseV) && !Array.isArray(v)) continue;
    // Se default è oggetto e incoming è oggetto (non array) → merge nested.
    if (
      baseV != null &&
      typeof baseV === "object" &&
      !Array.isArray(baseV) &&
      v != null &&
      typeof v === "object" &&
      !Array.isArray(v)
    ) {
      out[k] = deepMergeWithDefaults(
        baseV as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

function sanitizeSlide(slide: Slide | null | undefined): Slide | null {
  if (!slide || !slide.template) return null;
  try {
    const base = makeDefaultData(slide.template) as unknown as Record<string, unknown>;
    const incoming = (slide.data ?? {}) as unknown as Record<string, unknown>;
    const merged = deepMergeWithDefaults(base, incoming);
    return { ...slide, data: merged as unknown as Slide["data"] };
  } catch {
    return null;
  }
}

export function CarouselBuilder({ projectId, contentId }: BuilderProps) {
  const navigate = useNavigate();
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

  const [contentName, setContentName] = useState("");
  const [contentType, setContentType] = useState<ContentType>("carousel");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState<ContentStatus>("in_progress");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [brief, setBrief] = useState<string>("");
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  // Snapshot del payload all'ultimo save / hydrate. dirty è computed = current !== snapshot.
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [savedName, setSavedName] = useState<string>("");

  // Load project + content on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setHydrating(true);
      try {
        const [proj, content] = await Promise.all([
          getProject(projectId),
          getContent(contentId),
        ]);
        if (cancelled) return;
        if (!content || !proj) {
          toast.error("Contenuto non trovato");
          void navigate({ to: "/projects/$projectId", params: { projectId } });
          return;
        }
        const data = (content.data ?? {}) as ContentDataShape;
        const brandFromProject = proj.brand ?? data.brand ?? DEFAULT_BRAND;
        const rawSlides = Array.isArray(data.slides) ? data.slides : [];
        // Merge ogni slide con i default del suo template per evitare crash
        // quando il payload nel DB ha campi mancanti (es. hook senza .hook).
        const slidesData = rawSlides.map((s) => sanitizeSlide(s)).filter(Boolean) as Slide[];
        loadJSON({ brand: brandFromProject, slides: slidesData });
        if (data.activeLang) setActiveLang(data.activeLang);
        setContentName(content.name);
        setContentType(content.type);
        setProjectName(proj.name);
        const rawStatus = data.status;
        const initialStatus: ContentStatus =
          rawStatus && rawStatus in STATUS_META && rawStatus !== "draft"
            ? (rawStatus as ContentStatus)
            : "in_progress";
        setStatus(initialStatus);
        setBrief(data.brief ?? "");
        // Carica data programmata e converte in formato yyyy-mm-dd per input[type=date].
        if (data.scheduledAt) {
          const d = new Date(data.scheduledAt);
          if (!Number.isNaN(d.getTime())) {
            setScheduledAt(d.toISOString().split("T")[0]);
          }
        } else {
          setScheduledAt("");
        }
        const initialScheduled = data.scheduledAt
          ? new Date(data.scheduledAt).toISOString().split("T")[0]
          : "";
        setSavedSnapshot(
          JSON.stringify({
            brand: brandFromProject,
            slides: slidesData,
            status: initialStatus,
            scheduledAt: initialScheduled,
          }),
        );
        setSavedName(content.name);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, contentId, loadJSON, setActiveLang, navigate]);

  const currentSnapshot = useMemo(
    () => (hydrating ? "" : JSON.stringify({ brand, slides, status, scheduledAt })),
    [brand, slides, status, scheduledAt, hydrating],
  );
  const dirty = !hydrating && (currentSnapshot !== savedSnapshot || contentName !== savedName);

  // Avvisa l'utente se chiude la pagina con modifiche non salvate.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function handleSave() {
    setSaving(true);
    try {
      const finalName = contentName || "Senza titolo";
      // Genera una thumbnail della prima slide (best-effort, non blocca il save).
      let thumbnail: string | null = null;
      const firstSlide = slides[0];
      if (firstSlide) {
        const node = exportRefs.current.get(firstSlide.id);
        if (node) thumbnail = await captureThumbnail(node, brand);
      }
      await saveContent({
        id: contentId,
        projectId,
        type: contentType,
        name: finalName,
        data: {
          brand,
          slides,
          activeLang,
          status,
          publishedAt: status === "published" ? new Date().toISOString() : undefined,
          scheduledAt: scheduledAt
            ? new Date(scheduledAt + "T09:00:00").toISOString()
            : undefined,
        },
        thumbnail,
      });
      // Brand per-progetto: fonte di verità. Si propaga ai content fratelli al loro prossimo open.
      await updateProject(projectId, { brand });
      setSavedSnapshot(JSON.stringify({ brand, slides, status, scheduledAt }));
      setSavedName(finalName);
      toast.success(status === "published" ? "Pubblicato ✓" : "Salvato come bozza");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const activeIndex = useMemo(
    () => slides.findIndex((s) => s.id === activeId),
    [slides, activeId],
  );
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

  // ⌘Z / ⌘⇧Z + ⌘S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        void handleSave();
      } else if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, contentId, projectId, brand, slides, activeLang, contentName, contentType]);

  useEffect(() => {
    const id = "carousel-google-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const families = new Set([
      "Figtree:wght@400;500;600;700;800;900",
      "JetBrains Mono:wght@400;500;700",
    ]);
    const w = "wght@400;500;600;700;800;900";
    [brand.fontHeading, brand.fontBody].forEach((f) => {
      if (f === "Figtree" || f === "JetBrains Mono") return;
      families.add(`${f}:${w}`);
    });
    link.href =
      "https://fonts.googleapis.com/css2?" +
      Array.from(families)
        .map((f) => "family=" + f.replace(/ /g, "+"))
        .join("&") +
      "&display=swap";
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
    a.download = `${slugify(contentName || brand.carouselTitle)}.json`;
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

  if (hydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Caricamento contenuto…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground md:h-screen">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card px-3 py-2 md:h-14 md:flex-nowrap md:px-4 md:py-0">
        <ProjectSwitcher currentProjectId={projectId} currentName={projectName} />
        <span className="text-muted-foreground/60">/</span>
        <ContentSwitcher
          projectId={projectId}
          currentContentId={contentId}
          currentName={contentName}
          currentType={contentType}
        />
        <Input
          value={contentName}
          onChange={(e) => setContentName(e.target.value)}
          className="order-3 h-8 w-full min-w-[220px] md:order-none md:max-w-xs"
          placeholder="Nome contenuto"
        />

        <div className="flex items-center gap-1 md:ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={undo}
            disabled={past.length === 0}
            title="Annulla (⌘Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={redo}
            disabled={future.length === 0}
            title="Ripeti (⌘⇧Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {brand.languages.length > 1 && (
          <Select value={activeLang} onValueChange={setActiveLang}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {brand.languages.map((l) => (
                <SelectItem key={l} value={l}>
                  {langLabel(l)}
                  {l === brand.defaultLanguage && " ★"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="order-4 -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-2 overflow-x-auto px-3 pb-1 md:order-none md:mx-0 md:ml-auto md:w-auto md:overflow-visible md:px-0 md:pb-0">
          <Button
            variant={dirty ? "default" : "outline"}
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving}
            title="Salva (⌘S)"
          >
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {dirty ? "Salva*" : "Salvato"}
          </Button>
          <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
            <SelectTrigger
              className={`h-8 w-[170px] gap-1 text-xs font-medium border ${STATUS_META[status].bg}`}
              title="Stato workflow"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="mr-2">{STATUS_META[s].emoji}</span>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="date"
              value={scheduledAt}
              onChange={(e) => {
                const v = e.target.value;
                setScheduledAt(v);
                // Auto-bump status a 'scheduled' quando setti una data e non è già pubblicato
                if (v && status !== "published" && status !== "scheduled") {
                  setStatus("scheduled");
                }
                // Clear data → torna a review se era scheduled
                if (!v && status === "scheduled") {
                  setStatus("review");
                }
              }}
              className="h-8 w-[140px] pl-7 text-xs"
              title="Data pubblicazione programmata"
            />
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs">
              📅
            </span>
            {scheduledAt && (
              <button
                type="button"
                onClick={() => setScheduledAt("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-destructive"
                title="Rimuovi data"
              >
                ✕
              </button>
            )}
          </div>
          <CarouselPresetDialog />
          <QuickOfferEditor />
          <HookOfferMicroEditor />
          <ContentImportDialog />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setValidationOverlay(!validationOverlay)}
            title={
              validationOverlay
                ? "Nascondi indicatori validazione"
                : "Mostra indicatori validazione"
            }
          >
            {validationOverlay ? (
              <ShieldCheck className="h-4 w-4 text-primary" />
            ) : (
              <ShieldOff className="h-4 w-4" />
            )}
          </Button>
          <BrandQuickSwitch />
          <BulkOperationsDialog />
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            disabled={!activeSlide}
          >
            <Eye className="mr-1 h-4 w-4" /> Anteprima
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchOpen(true)}
            disabled={slides.length === 0}
          >
            <LayoutGrid className="mr-1 h-4 w-4" /> Anteprima ZIP
          </Button>
          <ExportButton
            exportRefs={exportRefs}
            activeSlideId={activeSlide?.id ?? null}
            activeIndex={activeIndex}
            brandTitle={contentName || brand.carouselTitle}
            onError={setExportError}
          />
          <MultiFormatExportDialog baseName={contentName || brand.carouselTitle || "carosello"} />
          <UserMenu />
        </div>
      </header>

      {exportError && (
        <ExportErrorBanner message={exportError} onDismiss={() => setExportError(null)} />
      )}

      {brief && slides.length === 0 && (
        <BriefBanner
          brief={brief}
          onGenerate={async () => {
            try {
              const { parseTextToSlides } = await import("@/lib/textToSlides");
              const result = parseTextToSlides(brief);
              if (result.items.length === 0) {
                toast.error("Brief non riconosciuto: usa # Titolo + ## Sezioni");
                return;
              }
              const newSlides = result.items.map((it) =>
                makeDefaultSlide(it.template, "portrait"),
              );
              // Applica i data parsati su ogni slide.
              const slidesWithData: Slide[] = newSlides.map((s, i) => ({
                ...s,
                data: result.items[i].data as Slide["data"],
              }));
              loadJSON({ brand, slides: slidesWithData });
              toast.success(`${slidesWithData.length} slide generate dal brief`);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
          onClear={() => setBrief("")}
        />
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
              {validationIssues.length} {validationIssues.length === 1 ? "slide ha" : "slide hanno"}{" "}
              campi obbligatori mancanti
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

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <SlidesSidebar />

        <main className="relative flex min-h-[45vh] flex-1 items-center justify-center overflow-auto bg-[#1a1a1a] p-3 md:min-h-0 md:p-6">
          {activeSlide ? (
            (() => {
              const dim = FORMAT_DIMENSIONS[activeSlide.format ?? "portrait"];
              return (
                <ScaledPreview key={activeSlide.id + activeLang} w={dim.w} h={dim.h}>
                  <SlideRenderer
                    slide={activeSlide}
                    brand={brand}
                    index={activeIndex}
                    total={slides.length}
                    lang={activeLang}
                    showValidation={validationOverlay}
                  />
                </ScaledPreview>
              );
            })()
          ) : (
            <div className="text-muted-foreground">Nessuna slide selezionata</div>
          )}
        </main>

        <aside className="flex h-[55vh] w-full shrink-0 flex-col border-t border-border bg-card md:h-full md:w-[380px] md:border-l md:border-t-0">
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

      <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
        {slides.map((s, i) => {
          const dim = FORMAT_DIMENSIONS[s.format ?? "portrait"];
          return (
            <div key={s.id} ref={setExportRef(s.id)} style={{ width: dim.w, height: dim.h }}>
              <SlideRenderer
                slide={s}
                brand={brand}
                index={i}
                total={slides.length}
                lang={activeLang}
              />
            </div>
          );
        })}
      </div>

      <ExportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        brandTitle={contentName || brand.carouselTitle}
      />
      <ExportBatchPreviewDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        brandTitle={contentName || brand.carouselTitle}
      />

      {guideOpen && flatIssues.length > 0 && (
        <FixIssuesGuide
          issues={flatIssues}
          index={guideIndex}
          onPrev={() => {
            const ni = Math.max(0, guideIndex - 1);
            setGuideIndex(ni);
            jumpToIssue(flatIssues[ni]);
          }}
          onNext={() => {
            const ni = Math.min(flatIssues.length - 1, guideIndex + 1);
            setGuideIndex(ni);
            jumpToIssue(flatIssues[ni]);
          }}
          onSkip={() => {
            const ni = Math.min(flatIssues.length - 1, guideIndex + 1);
            setGuideIndex(ni);
            jumpToIssue(flatIssues[ni]);
          }}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </div>
  );
}

function ScaledPreview({
  children,
  w = 1080,
  h = 1350,
}: {
  children: React.ReactNode;
  w?: number;
  h?: number;
}) {
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
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "carosello"
  );
}

/**
 * Banner che appare quando un contenuto ha un brief importato (da file o
 * incolla bulk) ma le slide non sono ancora state generate. Click → parser
 * markdown → slide popolate.
 */
function BriefBanner({
  brief,
  onGenerate,
  onClear,
}: {
  brief: string;
  onGenerate: () => void | Promise<void>;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3 px-4 py-2.5">
        <div className="mt-0.5 text-lg">📝</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-foreground">
            Brief importato — pronto da convertire in slide
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {brief.split("\n").find((l) => l.trim())?.slice(0, 120)}
            {brief.length > 120 ? "…" : ""} · {brief.length} caratteri
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(!open)}
          className="h-7 text-xs"
        >
          {open ? "Nascondi" : "Mostra"}
        </Button>
        <Button
          size="sm"
          onClick={() => void onGenerate()}
          className="h-7"
        >
          ✨ Genera slide dal brief
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="h-7"
          title="Scarta il brief"
        >
          ✕
        </Button>
      </div>
      {open && (
        <div className="border-t border-primary/20 bg-card/50 px-4 py-3">
          <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
            {brief}
          </pre>
        </div>
      )}
    </div>
  );
}
