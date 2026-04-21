import { useEffect, useMemo, useRef, useState } from "react";
import { useCarousel } from "@/lib/store";
import type {
  Slide,
  SplitData,
  Grid2x2Data,
  BigNumData,
  CenterData,
  TimelineData,
  CompareData,
  VocabData,
  QAData,
  ChecklistData,
  StatData,
  CoverData,
  GalleryData,
  ImageQuoteData,
  ChartBarData,
  ChartDonutData,
  ChartLineData,
  FeatureData,
  TestimonialData,
  MythData,
  ProcessData,
  ProsConsData,
  QuoteBigData,
  RoadmapData,
  RoadmapStatus,
  CtaData,
  HookData,
  ProblemSolutionData,
  MistakesData,
  FrameworkData,
  SocialProofData,
  OfferData,
  ObjectionData,
  TipPackData,
  UrgencyData,
  BonusStackData,
  GuaranteeData,
  FaqData,
  QuickWinData,
  MediaHeroData,
  PolaroidStackData,
  SplitDuoData,
  MagazineCoverData,
  ChartAreaData,
  ChartCompareBarData,
  KpiGridData,
  FunnelChartData,
  AnyTemplateData,
} from "@/lib/templates";
import { getSlideData } from "@/lib/i18n";
import { validateSlideData } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField } from "@/components/ImageUploadField";
import { TextStylePopover } from "@/components/TextStylePopover";
import { FontSizeSlider } from "@/components/FontSizeSlider";
import { langLabel } from "@/lib/i18n";
import { Trash2, Plus, AlertCircle, Info } from "lucide-react";
import { LIMITS } from "@/lib/validation";

interface Props { slide: Slide }

export function SlideEditorForm({ slide }: Props) {
  const update = useCarousel((s) => s.updateSlide);
  const activeLang = useCarousel((s) => s.activeLang);
  const setActiveLangRaw = useCarousel((s) => s.setActiveLang);
  const languages = useCarousel((s) => s.brand.languages);
  const defaultLang = useCarousel((s) => s.brand.defaultLanguage);

  const data = useMemo(
    () => getSlideData(slide, activeLang, defaultLang),
    [slide, activeLang, defaultLang],
  );

  // Debounced update — local draft commits 400ms after last keystroke
  const [draft, setDraft] = useState<AnyTemplateData>(data);
  const draftRef = useRef(draft);
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    setDraft(data);
    draftRef.current = data;
  }, [data]);

  const set = (next: AnyTemplateData) => {
    setDraft(next);
    draftRef.current = next;
  };

  // Commit draft on debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (draftRef.current !== data) {
        skipNextSync.current = true;
        update(slide.id, draftRef.current);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [draft, data, slide.id, update]);

  // Commit immediately on slide change / unmount
  useEffect(() => {
    return () => {
      if (draftRef.current !== data) {
        update(slide.id, draftRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id]);

  // Flush pending draft sync before switching language to avoid losing edits.
  const setActiveLang = (code: string) => {
    if (code === activeLang) return;
    if (draftRef.current !== data) {
      update(slide.id, draftRef.current);
    }
    setActiveLangRaw(code);
  };

  const allIssues = useMemo(
    () => validateSlideData(slide.template, draft).errors,
    [slide.template, draft],
  );
  const errFor = (field: string) =>
    allIssues.find((e) => e.field === field && (e.severity ?? "error") === "error")?.message;
  const warnFor = (field: string) =>
    allIssues.find((e) => e.field === field && e.severity === "warning")?.message;

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slideId: string; field: string }>).detail;
      if (!detail || detail.slideId !== slide.id) return;
      const tryFocus = (attempt = 0) => {
        const root = containerRef.current;
        if (!root) {
          if (attempt < 10) setTimeout(() => tryFocus(attempt + 1), 50);
          return;
        }
        const el = root.querySelector<HTMLElement>(`[data-field="${CSS.escape(detail.field)}"]`);
        if (!el) {
          if (attempt < 10) setTimeout(() => tryFocus(attempt + 1), 50);
          return;
        }
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          (el as HTMLInputElement | HTMLTextAreaElement).focus?.();
          el.classList.add("ring-2", "ring-destructive", "animate-pulse");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-destructive", "animate-pulse");
          }, 1500);
        }, 100);
      };
      tryFocus();
    };
    window.addEventListener("slide:focus-field", handler);
    return () => window.removeEventListener("slide:focus-field", handler);
  }, [slide.id]);

  const overrides = slide.textOverrides;
  const styleProps = { slideId: slide.id, overrides };

  const editorProps = { errFor, warnFor, ...styleProps };
  let body: React.ReactNode = null;
  switch (slide.template) {
    case "split":       body = <SplitEditor d={draft as SplitData} set={set as (d: SplitData) => void} {...editorProps} />; break;
    case "grid2x2":     body = <GridEditor d={draft as Grid2x2Data} set={set as (d: Grid2x2Data) => void} {...editorProps} />; break;
    case "bignum":      body = <BigNumEditor d={draft as BigNumData} set={set as (d: BigNumData) => void} {...editorProps} />; break;
    case "center":      body = <CenterEditor d={draft as CenterData} set={set as (d: CenterData) => void} {...editorProps} />; break;
    case "timeline":    body = <TimelineEditor d={draft as TimelineData} set={set as (d: TimelineData) => void} {...editorProps} />; break;
    case "compare":     body = <CompareEditor d={draft as CompareData} set={set as (d: CompareData) => void} {...editorProps} />; break;
    case "vocab":       body = <VocabEditor d={draft as VocabData} set={set as (d: VocabData) => void} {...editorProps} />; break;
    case "qa":          body = <QAEditor d={draft as QAData} set={set as (d: QAData) => void} {...editorProps} />; break;
    case "checklist":   body = <ChecklistEditor d={draft as ChecklistData} set={set as (d: ChecklistData) => void} {...editorProps} />; break;
    case "stat":        body = <StatEditor d={draft as StatData} set={set as (d: StatData) => void} {...editorProps} />; break;
    case "cover":       body = <CoverEditor d={draft as CoverData} set={set as (d: CoverData) => void} {...editorProps} />; break;
    case "gallery":     body = <GalleryEditor d={draft as GalleryData} set={set as (d: GalleryData) => void} {...editorProps} />; break;
    case "imageQuote":  body = <ImageQuoteEditor d={draft as ImageQuoteData} set={set as (d: ImageQuoteData) => void} {...editorProps} />; break;
    case "chartBar":    body = <ChartBarEditor d={draft as ChartBarData} set={set as (d: ChartBarData) => void} {...editorProps} />; break;
    case "chartDonut":  body = <ChartDonutEditor d={draft as ChartDonutData} set={set as (d: ChartDonutData) => void} {...editorProps} />; break;
    case "chartLine":   body = <ChartLineEditor d={draft as ChartLineData} set={set as (d: ChartLineData) => void} {...editorProps} />; break;
    case "feature":     body = <FeatureEditor d={draft as FeatureData} set={set as (d: FeatureData) => void} {...editorProps} />; break;
    case "testimonial": body = <TestimonialEditor d={draft as TestimonialData} set={set as (d: TestimonialData) => void} {...editorProps} />; break;
    case "myth":        body = <MythEditor d={draft as MythData} set={set as (d: MythData) => void} {...editorProps} />; break;
    case "process":     body = <ProcessEditor d={draft as ProcessData} set={set as (d: ProcessData) => void} {...editorProps} />; break;
    case "prosCons":    body = <ProsConsEditor d={draft as ProsConsData} set={set as (d: ProsConsData) => void} {...editorProps} />; break;
    case "quoteBig":    body = <QuoteBigEditor d={draft as QuoteBigData} set={set as (d: QuoteBigData) => void} {...editorProps} />; break;
    case "roadmap":     body = <RoadmapEditor d={draft as RoadmapData} set={set as (d: RoadmapData) => void} {...editorProps} />; break;
    case "cta":         body = <CtaEditor d={draft as CtaData} set={set as (d: CtaData) => void} {...editorProps} />; break;
    case "hook":        body = <HookEditor d={draft as HookData} set={set as (d: HookData) => void} {...editorProps} />; break;
    case "problemSolution": body = <ProblemSolutionEditor d={draft as ProblemSolutionData} set={set as (d: ProblemSolutionData) => void} {...editorProps} />; break;
    case "mistakes":    body = <MistakesEditor d={draft as MistakesData} set={set as (d: MistakesData) => void} {...editorProps} />; break;
    case "framework":   body = <FrameworkEditor d={draft as FrameworkData} set={set as (d: FrameworkData) => void} {...editorProps} />; break;
    case "socialProof": body = <SocialProofEditor d={draft as SocialProofData} set={set as (d: SocialProofData) => void} {...editorProps} />; break;
    case "offer":       body = <OfferEditor d={draft as OfferData} set={set as (d: OfferData) => void} {...editorProps} />; break;
    case "objection":   body = <ObjectionEditor d={draft as ObjectionData} set={set as (d: ObjectionData) => void} {...editorProps} />; break;
    case "tipPack":     body = <TipPackEditor d={draft as TipPackData} set={set as (d: TipPackData) => void} {...editorProps} />; break;
    case "urgency":     body = <UrgencyEditor d={draft as UrgencyData} set={set as (d: UrgencyData) => void} {...editorProps} />; break;
    case "bonusStack":  body = <BonusStackEditor d={draft as BonusStackData} set={set as (d: BonusStackData) => void} {...editorProps} />; break;
    case "guarantee":   body = <GuaranteeEditor d={draft as GuaranteeData} set={set as (d: GuaranteeData) => void} {...editorProps} />; break;
    case "faq":         body = <FaqEditor d={draft as FaqData} set={set as (d: FaqData) => void} {...editorProps} />; break;
    case "quickWin":    body = <QuickWinEditor d={draft as QuickWinData} set={set as (d: QuickWinData) => void} {...editorProps} />; break;
    case "mediaHero":   body = <MediaHeroEditor d={draft as MediaHeroData} set={set as (d: MediaHeroData) => void} {...editorProps} />; break;
    case "polaroidStack": body = <PolaroidStackEditor d={draft as PolaroidStackData} set={set as (d: PolaroidStackData) => void} {...editorProps} />; break;
    case "splitDuo":    body = <SplitDuoEditor d={draft as SplitDuoData} set={set as (d: SplitDuoData) => void} {...editorProps} />; break;
    case "magazineCover": body = <MagazineCoverEditor d={draft as MagazineCoverData} set={set as (d: MagazineCoverData) => void} {...editorProps} />; break;
    case "chartArea":   body = <ChartAreaEditor d={draft as ChartAreaData} set={set as (d: ChartAreaData) => void} {...editorProps} />; break;
    case "chartCompareBar": body = <ChartCompareBarEditor d={draft as ChartCompareBarData} set={set as (d: ChartCompareBarData) => void} {...editorProps} />; break;
    case "kpiGrid":     body = <KpiGridEditor d={draft as KpiGridData} set={set as (d: KpiGridData) => void} {...editorProps} />; break;
    case "funnelChart": body = <FunnelChartEditor d={draft as FunnelChartData} set={set as (d: FunnelChartData) => void} {...editorProps} />; break;
  }

  return (
    <div ref={containerRef} className="space-y-4 overflow-x-hidden">
      {languages.length > 1 && (
        <Tabs value={activeLang} onValueChange={setActiveLang}>
          <TabsList className="w-full" style={{ gridTemplateColumns: `repeat(${languages.length}, 1fr)`, display: "grid" }}>
            {languages.map((l) => (
              <TabsTrigger key={l} value={l}>
                {langLabel(l)}{l === defaultLang && " ★"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {body}
    </div>
  );
}

type ErrFor = (field: string) => string | undefined;
type WarnFor = (field: string) => string | undefined;
type StyleProps = { slideId: string; overrides?: Record<string, import("@/lib/templates").TextStyle> };
type EditorProps<T> = { d: T; set: (d: T) => void; errFor: ErrFor; warnFor: WarnFor } & StyleProps;

function Field({ label, hint, error, warning, slideId, fieldPath, overrides, children }: {
  label: string;
  hint?: string;
  error?: string;
  warning?: string;
  slideId?: string;
  fieldPath?: string;
  overrides?: Record<string, import("@/lib/templates").TextStyle>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className={`text-xs uppercase tracking-wider ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {label}{error && " *"}
        </Label>
        {slideId && fieldPath && (
          <div className="flex items-center gap-1">
            <FontSizeSlider slideId={slideId} fieldPath={fieldPath} value={overrides?.[fieldPath]} />
            <TextStylePopover slideId={slideId} fieldPath={fieldPath} value={overrides?.[fieldPath]} />
          </div>
        )}
      </div>
      <div className={error ? "[&_input]:border-destructive [&_textarea]:border-destructive [&_input]:focus-visible:ring-destructive [&_textarea]:focus-visible:ring-destructive" : ""}>
        {children}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
      {!error && warning && (
        <p className="flex items-center gap-1 text-[11px] text-sky-500">
          <Info className="h-3 w-3" /> {warning}
        </p>
      )}
      {hint && !error && !warning && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ItemCounter({ current, min, max, unit = "elementi" }: { current: number; min: number; max: number; unit?: string }) {
  const inRange = current >= min && current <= max;
  const tone = inRange
    ? "text-emerald-500"
    : current < min
      ? "text-amber-500"
      : "text-destructive";
  return (
    <span className={`text-[10px] font-medium ${tone}`}>
      {current}/{max} {unit} {current < min && `(min ${min})`}
    </span>
  );
}

const HL_HINT = "Usa {hl}testo{/hl} per evidenziare in colore accent";

/* ---------------- Split ---------------- */
/* ---------------- Split ---------------- */
function SplitEditor({ d, set, errFor, slideId, overrides }: EditorProps<SplitData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ImageUploadField label="Immagine (opzionale)" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Se presente, sostituisce paragrafi/lista a destra." />
      <ArrayField
        label="Paragrafi"
        items={d.paragraphs ?? []}
        onChange={(arr) => set({ ...d, paragraphs: arr })}
        render={(v, on, i) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">#{i + 1}</Label>
              <div className="flex items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`paragraphs.${i}`} value={overrides?.[`paragraphs.${i}`]} />
                <TextStylePopover slideId={slideId} fieldPath={`paragraphs.${i}`} value={overrides?.[`paragraphs.${i}`]} />
              </div>
            </div>
            <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />
          </div>
        )}
        empty=""
      />
      <ArrayField
        label="Lista"
        items={d.list ?? []}
        onChange={(arr) => set({ ...d, list: arr })}
        render={(v, on, i) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">#{i + 1}</Label>
              <div className="flex items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`list.${i}.text`} value={overrides?.[`list.${i}.text`]} />
                <TextStylePopover slideId={slideId} fieldPath={`list.${i}.text`} value={overrides?.[`list.${i}.text`]} />
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <Input value={v.marker} onChange={(e) => on({ ...v, marker: e.target.value })} placeholder="01" />
              <Input value={v.text} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Voce" />
            </div>
          </div>
        )}
        empty={{ marker: "", text: "" }}
      />
    </div>
  );
}

/* ---------------- Grid 2x2 ---------------- */
function GridEditor({ d, set, errFor, slideId, overrides }: EditorProps<Grid2x2Data>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">4 Riquadri</Label>
      {d.cells.map((c, i) => {
        const cellErr = errFor(`cells.${i}.title`);
        return (
          <div key={i} className={`space-y-2 rounded-md border p-3 ${cellErr ? "border-destructive" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Cella {i + 1}</span>
              <div className="flex flex-wrap items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`cells.${i}.title`} value={overrides?.[`cells.${i}.title`]} />
                <TextStylePopover slideId={slideId} fieldPath={`cells.${i}.title`} value={overrides?.[`cells.${i}.title`]} />
                <FontSizeSlider compact slideId={slideId!} fieldPath={`cells.${i}.text`} value={overrides?.[`cells.${i}.text`]} />
                <TextStylePopover slideId={slideId} fieldPath={`cells.${i}.text`} value={overrides?.[`cells.${i}.text`]} />
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <Input value={c.num} onChange={(e) => { const cells = [...d.cells]; cells[i] = { ...c, num: e.target.value }; set({ ...d, cells }); }} placeholder="01" />
              <Input data-field={`cells.${i}.title`} value={c.title} className={cellErr ? "border-destructive" : ""} onChange={(e) => { const cells = [...d.cells]; cells[i] = { ...c, title: e.target.value }; set({ ...d, cells }); }} placeholder="Titolo *" />
            </div>
            <Textarea rows={2} value={c.text} onChange={(e) => { const cells = [...d.cells]; cells[i] = { ...c, text: e.target.value }; set({ ...d, cells }); }} placeholder="Testo" />
            {cellErr && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {cellErr}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- BigNum ---------------- */
function BigNumEditor({ d, set, errFor, slideId, overrides }: EditorProps<BigNumData>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numero" error={errFor("number")} slideId={slideId} fieldPath="number" overrides={overrides}><Input data-field="number" value={d.number} onChange={(e) => set({ ...d, number: e.target.value })} /></Field>
        <Field label="Sottotitolo numero" slideId={slideId} fieldPath="numberSub" overrides={overrides}><Input value={d.numberSub} onChange={(e) => set({ ...d, numberSub: e.target.value })} /></Field>
      </div>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ArrayField label="Paragrafi" items={d.paragraphs} onChange={(arr) => set({ ...d, paragraphs: arr })}
        render={(v, on, i) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">#{i + 1}</Label>
              <div className="flex items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`paragraphs.${i}`} value={overrides?.[`paragraphs.${i}`]} />
                <TextStylePopover slideId={slideId} fieldPath={`paragraphs.${i}`} value={overrides?.[`paragraphs.${i}`]} />
              </div>
            </div>
            <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />
          </div>
        )} empty="" />
    </div>
  );
}

/* ---------------- Center ---------------- */
function CenterEditor({ d, set, errFor, slideId, overrides }: EditorProps<CenterData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Frase principale" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={3} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Sottotitolo" slideId={slideId} fieldPath="sub" overrides={overrides}><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
      <ImageUploadField label="Immagine di sfondo (opzionale)" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Renderizzata sfocata sotto il testo." />
    </div>
  );
}

/* ---------------- Timeline ---------------- */
function TimelineEditor({ d, set, errFor, slideId, overrides }: EditorProps<TimelineData>) {
  const itemsErr = errFor("items");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {itemsErr && <p data-field="items" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {itemsErr}</p>}
      <ArrayField label="Step" items={d.items} onChange={(arr) => set({ ...d, items: arr })}
        render={(v, on, i) => {
          const itemTitleErr = errFor(`items.${i}.title`);
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`items.${i}.title`} value={overrides?.[`items.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`items.${i}.title`} value={overrides?.[`items.${i}.title`]} />
                </div>
              </div>
              <Input value={v.when} onChange={(e) => on({ ...v, when: e.target.value })} placeholder="GIORNO 01" />
              <Input data-field={`items.${i}.title`} value={v.title} className={itemTitleErr ? "border-destructive" : ""} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo step *" />
              <Textarea rows={2} value={v.text} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Descrizione" />
            </div>
          );
        }}
        empty={{ when: "", title: "", text: "" }}
      />
    </div>
  );
}

/* ---------------- Compare ---------------- */
function CompareEditor({ d, set, errFor, slideId, overrides }: EditorProps<CompareData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {(["before", "after"] as const).map((side) => {
        const titleErr = errFor(`${side}.title`);
        const itemsErr = errFor(`${side}.items`);
        return (
          <div key={side} className={`space-y-2 rounded-md border p-3 ${titleErr || itemsErr ? "border-destructive" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{side === "before" ? "Prima" : "Dopo (in evidenza)"}</div>
              <div className="flex items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`${side}.title`} value={overrides?.[`${side}.title`]} />
                <TextStylePopover slideId={slideId} fieldPath={`${side}.title`} value={overrides?.[`${side}.title`]} />
              </div>
            </div>
            <Input value={d[side].tag} onChange={(e) => set({ ...d, [side]: { ...d[side], tag: e.target.value } })} placeholder="TAG" />
            <Input data-field={`${side}.title`} value={d[side].title} className={titleErr ? "border-destructive" : ""} onChange={(e) => set({ ...d, [side]: { ...d[side], title: e.target.value } })} placeholder="Titolo colonna *" />
            {titleErr && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {titleErr}</p>}
            <ArrayField label="Voci" items={d[side].items}
              onChange={(items) => set({ ...d, [side]: { ...d[side], items } })}
              render={(v, on, i) => {
                const voiceErr = errFor(`${side}.items.${i}`);
                return <Input data-field={`${side}.items.${i}`} value={v} className={voiceErr ? "border-destructive" : ""} onChange={(e) => on(e.target.value)} />;
              }} empty="" />
            {itemsErr && <p data-field={`${side}.items`} className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {itemsErr}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Vocab ---------------- */
function VocabEditor({ d, set, errFor, slideId, overrides }: EditorProps<VocabData>) {
  return (
    <div className="space-y-4">
      <Field label="Categoria" slideId={slideId} fieldPath="category" overrides={overrides}><Input value={d.category} onChange={(e) => set({ ...d, category: e.target.value })} /></Field>
      <Field label="Parola" error={errFor("word")} slideId={slideId} fieldPath="word" overrides={overrides}><Input data-field="word" value={d.word} onChange={(e) => set({ ...d, word: e.target.value })} /></Field>
      <Field label="Pronuncia / categoria gramm."><Input value={d.pron} onChange={(e) => set({ ...d, pron: e.target.value })} /></Field>
      <Field label="Etichetta definizione"><Input value={d.defLabel} onChange={(e) => set({ ...d, defLabel: e.target.value })} /></Field>
      <Field label="Definizione" error={errFor("def")} slideId={slideId} fieldPath="def" overrides={overrides}><Textarea data-field="def" rows={3} value={d.def} onChange={(e) => set({ ...d, def: e.target.value })} /></Field>
      <Field label="Esempio / citazione" slideId={slideId} fieldPath="example" overrides={overrides}><Textarea rows={2} value={d.example} onChange={(e) => set({ ...d, example: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- QA ---------------- */
function QAEditor({ d, set, errFor, slideId, overrides }: EditorProps<QAData>) {
  const answerErr = errFor("answer");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etichetta Q"><Input value={d.qLabel} onChange={(e) => set({ ...d, qLabel: e.target.value })} /></Field>
        <Field label="Etichetta A"><Input value={d.aLabel} onChange={(e) => set({ ...d, aLabel: e.target.value })} /></Field>
      </div>
      <Field label="Domanda" error={errFor("question")} slideId={slideId} fieldPath="question" overrides={overrides}><Textarea data-field="question" rows={2} value={d.question} onChange={(e) => set({ ...d, question: e.target.value })} /></Field>
      {answerErr && <p data-field="answer" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {answerErr}</p>}
      <ArrayField label="Risposta (paragrafi)" items={d.answer} onChange={(arr) => set({ ...d, answer: arr })}
        render={(v, on, i) => {
          const pErr = errFor(`answer.${i}`);
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Paragrafo {i + 1}</Label>
              <div className="flex items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`answer.${i}`} value={overrides?.[`answer.${i}`]} />
                <TextStylePopover slideId={slideId} fieldPath={`answer.${i}`} value={overrides?.[`answer.${i}`]} />
              </div>
              </div>
              <Textarea data-field={`answer.${i}`} rows={2} value={v} className={pErr ? "border-destructive" : ""} onChange={(e) => on(e.target.value)} />
            </div>
          );
        }} empty="" />
    </div>
  );
}

/* ---------------- Checklist ---------------- */
function ChecklistEditor({ d, set, errFor, slideId, overrides }: EditorProps<ChecklistData>) {
  const itemsErr = errFor("items");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Meta (es. '5 PASSI · 10 MIN')"><Input value={d.meta} onChange={(e) => set({ ...d, meta: e.target.value })} /></Field>
      {itemsErr && <p data-field="items" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {itemsErr}</p>}
      <ArrayField label="Voci" items={d.items} onChange={(arr) => set({ ...d, items: arr })}
        render={(v, on, i) => {
          const itemTitleErr = errFor(`items.${i}.title`);
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={v.done} onCheckedChange={(c) => on({ ...v, done: c })} />
                  <span className="text-xs text-muted-foreground">Fatto</span>
                </div>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`items.${i}.title`} value={overrides?.[`items.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`items.${i}.title`} value={overrides?.[`items.${i}.title`]} />
                </div>
              </div>
              <Input data-field={`items.${i}.title`} value={v.title} className={itemTitleErr ? "border-destructive" : ""} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Voce *" />
              <Input value={v.note ?? ""} onChange={(e) => on({ ...v, note: e.target.value })} placeholder="Nota (opzionale)" />
            </div>
          );
        }}
        empty={{ done: false, title: "", note: "" }}
      />
    </div>
  );
}

/* ---------------- Stat ---------------- */
function StatEditor({ d, set, errFor, slideId, overrides }: EditorProps<StatData>) {
  return (
    <div className="space-y-4">
      <Field label="Etichetta" error={errFor("label")} slideId={slideId} fieldPath="label" overrides={overrides}><Input data-field="label" value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} /></Field>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Valore" error={errFor("value")} slideId={slideId} fieldPath="value" overrides={overrides}><Input data-field="value" value={d.value} onChange={(e) => set({ ...d, value: e.target.value })} /></Field>
        <Field label="Unità"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      </div>
      <Field label="Sottotitolo" slideId={slideId} fieldPath="sub" overrides={overrides}><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
      <Field label="Nota / fonte"><Input value={d.note ?? ""} onChange={(e) => set({ ...d, note: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- Cover ---------------- */
function CoverEditor({ d, set, errFor, slideId, overrides }: EditorProps<CoverData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Sottotitolo" slideId={slideId} fieldPath="sub" overrides={overrides}><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
      <ImageUploadField label="Immagine fullscreen" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} />
    </div>
  );
}

/* ---------------- ArrayField helper ---------------- */
function ArrayField<T>({ label, items, onChange, render, empty, maxItems, counter }: {
  label: string;
  items: T[];
  onChange: (arr: T[]) => void;
  render: (value: T, onItemChange: (v: T) => void, index: number) => React.ReactNode;
  empty: T;
  maxItems?: number;
  counter?: React.ReactNode;
}) {
  const atMax = maxItems !== undefined && items.length >= maxItems;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
        {counter}
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1">{render(it, (v) => { const arr = [...items]; arr[i] = v; onChange(arr); }, i)}</div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={atMax}
        title={atMax ? `Hai raggiunto il massimo di ${maxItems} elementi` : undefined}
        onClick={() => onChange([...items, structuredClone(empty)])}
      >
        <Plus className="h-4 w-4 mr-1" /> Aggiungi
      </Button>
    </div>
  );
}

/* ---------------- Gallery ---------------- */
function GalleryEditor({ d, set, errFor, slideId, overrides }: EditorProps<GalleryData>) {
  const imgsErr = errFor("images");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {imgsErr && <p data-field="images" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {imgsErr}</p>}
      <ArrayField
        label={`Immagini (${LIMITS.gallery.min}–${LIMITS.gallery.max})`}
        items={d.images}
        onChange={(arr) => set({ ...d, images: arr })}
        maxItems={LIMITS.gallery.max}
        counter={<ItemCounter current={d.images.filter((im) => im.url).length} min={LIMITS.gallery.min} max={LIMITS.gallery.max} unit="foto" />}
        render={(v, on, i) => (
          <div className="space-y-2 rounded-md border border-border p-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Foto {i + 1}</Label>
              <div className="flex items-center gap-1">
                <FontSizeSlider compact slideId={slideId!} fieldPath={`images.${i}.caption`} value={overrides?.[`images.${i}.caption`]} />
                <TextStylePopover slideId={slideId} fieldPath={`images.${i}.caption`} value={overrides?.[`images.${i}.caption`]} />
              </div>
            </div>
            <ImageUploadField label="" value={v.url} onChange={(url) => on({ ...v, url })} />
            <Input value={v.caption ?? ""} onChange={(e) => on({ ...v, caption: e.target.value })} placeholder="Didascalia (opzionale)" maxLength={LIMITS.captionMax} />
          </div>
        )}
        empty={{ url: undefined, caption: "" }}
      />
    </div>
  );
}

/* ---------------- ImageQuote ---------------- */
function ImageQuoteEditor({ d, set, errFor, warnFor, slideId, overrides }: EditorProps<ImageQuoteData>) {
  const imgWarn = warnFor("imageUrl");
  const imgErr = errFor("imageUrl");
  return (
    <div className="space-y-4">
      <div>
        <ImageUploadField label="Immagine fullscreen" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Renderizzata sotto la citazione." />
        {imgErr && <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {imgErr}</p>}
        {!imgErr && imgWarn && <p className="mt-1 flex items-center gap-1 text-[11px] text-sky-500"><Info className="h-3 w-3" /> {imgWarn}</p>}
      </div>
      <Field label="Citazione" error={errFor("quote")} slideId={slideId} fieldPath="quote" overrides={overrides}><Textarea data-field="quote" rows={4} value={d.quote} onChange={(e) => set({ ...d, quote: e.target.value })} /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Autore" error={errFor("author")} slideId={slideId} fieldPath="author" overrides={overrides}><Input data-field="author" value={d.author} onChange={(e) => set({ ...d, author: e.target.value })} /></Field>
        <Field label="Ruolo" slideId={slideId} fieldPath="role" overrides={overrides}><Input value={d.role ?? ""} onChange={(e) => set({ ...d, role: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/* ---------------- ChartBar ---------------- */
function ChartBarEditor({ d, set, errFor, slideId, overrides }: EditorProps<ChartBarData>) {
  const itemsErr = errFor("items");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Unità (opzionale)"><Input value={d.unit ?? ""} placeholder="%, k€…" onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      {itemsErr && <p data-field="items" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {itemsErr}</p>}
      <ArrayField
        label={`Voci (${LIMITS.chartBar.min}–${LIMITS.chartBar.max})`}
        items={d.items}
        onChange={(arr) => set({ ...d, items: arr.slice(0, LIMITS.chartBar.max) })}
        maxItems={LIMITS.chartBar.max}
        counter={<ItemCounter current={d.items.length} min={LIMITS.chartBar.min} max={LIMITS.chartBar.max} unit="voci" />}
        render={(v, on, i) => {
          const labelErr = errFor(`items.${i}.label`);
          const valErr = errFor(`items.${i}.value`);
          const colorErr = errFor(`items.${i}.color`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Voce {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`items.${i}.label`} value={overrides?.[`items.${i}.label`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`items.${i}.label`} value={overrides?.[`items.${i}.label`]} />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_100px_50px]">
                <Input className={`col-span-2 sm:col-span-1 ${labelErr ? "border-destructive" : ""}`} value={v.label} onChange={(e) => on({ ...v, label: e.target.value })} placeholder="Etichetta" />
                <Input type="number" min={0} className={valErr ? "border-destructive" : ""} value={v.value} onChange={(e) => on({ ...v, value: Number(e.target.value) || 0 })} placeholder="0" title="Numero positivo. Es. 42 o 3.5" />
                <Input type="color" value={v.color ?? "#00E5FF"} onChange={(e) => on({ ...v, color: e.target.value })} className="h-9 w-full p-1" />
              </div>
              {(labelErr || valErr || colorErr) && (
                <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {labelErr || valErr || colorErr}</p>
              )}
            </div>
          );
        }}
        empty={{ label: "Nuovo", value: 0 }}
      />
    </div>
  );
}

/* ---------------- ChartDonut ---------------- */
function ChartDonutEditor({ d, set, errFor, slideId, overrides }: EditorProps<ChartDonutData>) {
  const segsErr = errFor("segments");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Etichetta al centro (opzionale)"><Input value={d.centerLabel ?? ""} onChange={(e) => set({ ...d, centerLabel: e.target.value })} /></Field>
      {segsErr && <p data-field="segments" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {segsErr}</p>}
      <ArrayField
        label={`Segmenti (${LIMITS.chartDonut.min}–${LIMITS.chartDonut.max})`}
        items={d.segments}
        onChange={(arr) => set({ ...d, segments: arr.slice(0, LIMITS.chartDonut.max) })}
        maxItems={LIMITS.chartDonut.max}
        counter={<ItemCounter current={d.segments.length} min={LIMITS.chartDonut.min} max={LIMITS.chartDonut.max} unit="segmenti" />}
        render={(v, on, i) => {
          const labelErr = errFor(`segments.${i}.label`);
          const valErr = errFor(`segments.${i}.value`);
          const colorErr = errFor(`segments.${i}.color`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Segmento {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`segments.${i}.label`} value={overrides?.[`segments.${i}.label`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`segments.${i}.label`} value={overrides?.[`segments.${i}.label`]} />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_100px_50px]">
                <Input className={`col-span-2 sm:col-span-1 ${labelErr ? "border-destructive" : ""}`} value={v.label} onChange={(e) => on({ ...v, label: e.target.value })} placeholder="Etichetta" />
                <Input type="number" min={0} className={valErr ? "border-destructive" : ""} value={v.value} onChange={(e) => on({ ...v, value: Number(e.target.value) || 0 })} placeholder="0" title="Numero positivo. Es. 42 o 3.5" />
                <Input type="color" value={v.color ?? "#00E5FF"} onChange={(e) => on({ ...v, color: e.target.value })} className="h-9 w-full p-1" />
              </div>
              {(labelErr || valErr || colorErr) && (
                <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {labelErr || valErr || colorErr}</p>
              )}
            </div>
          );
        }}
        empty={{ label: "Nuovo", value: 0 }}
      />
    </div>
  );
}

/* ---------------- ChartLine ---------------- */
function ChartLineEditor({ d, set, errFor, slideId, overrides }: EditorProps<ChartLineData>) {
  const valuesErr = errFor("values");
  const updatePoint = (i: number, label: string, value: number) => {
    const xLabels = [...d.xLabels]; const values = [...d.values];
    xLabels[i] = label; values[i] = value;
    set({ ...d, xLabels, values });
  };
  const atMax = d.values.length >= LIMITS.chartLine.max;
  const addPoint = () => set({ ...d, xLabels: [...d.xLabels, `P${d.xLabels.length + 1}`], values: [...d.values, 0] });
  const removePoint = (i: number) => set({ ...d, xLabels: d.xLabels.filter((_, j) => j !== i), values: d.values.filter((_, j) => j !== i) });
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Unità (opzionale)"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Punti dati</Label>
          <ItemCounter current={d.values.length} min={LIMITS.chartLine.min} max={LIMITS.chartLine.max} unit="punti" />
        </div>
        {valuesErr && <p data-field="values" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {valuesErr}</p>}
        {d.xLabels.map((lb, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row">
            <Input className="flex-1" value={lb} onChange={(e) => updatePoint(i, e.target.value, d.values[i] ?? 0)} placeholder="Etichetta X" />
            <div className="flex gap-2">
              <Input className="flex-1 sm:w-24 sm:flex-none" type="number" value={d.values[i] ?? 0} onChange={(e) => updatePoint(i, lb, Number(e.target.value) || 0)} placeholder="0" title="Numero. Es. 42 o 3.5" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removePoint(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={atMax} title={atMax ? `Massimo ${LIMITS.chartLine.max} punti` : undefined} onClick={addPoint}>
          <Plus className="mr-1 h-4 w-4" /> Aggiungi punto
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Feature ---------------- */
function FeatureEditor({ d, set, errFor, slideId, overrides }: EditorProps<FeatureData>) {
  const bulletsErr = errFor("bullets");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ImageUploadField label="Immagine spotlight" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} />
      {bulletsErr && <p data-field="bullets" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {bulletsErr}</p>}
      <ArrayField
        label={`Bullet (${LIMITS.featureBullets.min}–${LIMITS.featureBullets.max})`}
        items={d.bullets}
        onChange={(arr) => set({ ...d, bullets: arr })}
        maxItems={LIMITS.featureBullets.max}
        counter={<ItemCounter current={d.bullets.length} min={LIMITS.featureBullets.min} max={LIMITS.featureBullets.max} unit="bullet" />}
        render={(v, on, i) => {
          const titleErr = errFor(`bullets.${i}.title`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bullet {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`bullets.${i}.title`} value={overrides?.[`bullets.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`bullets.${i}.title`} value={overrides?.[`bullets.${i}.title`]} />
                </div>
              </div>
              <div className="grid grid-cols-[60px_1fr] gap-2 sm:grid-cols-[80px_1fr]">
                <Input value={v.marker} onChange={(e) => on({ ...v, marker: e.target.value })} placeholder="01" />
                <Input className={titleErr ? "border-destructive" : ""} value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo *" />
              </div>
              <Textarea rows={2} value={v.text ?? ""} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Descrizione (opzionale)" />
              {titleErr && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {titleErr}</p>}
            </div>
          );
        }}
        empty={{ marker: "", title: "", text: "" }}
      />
    </div>
  );
}

/* ---------------- Testimonial ---------------- */
function TestimonialEditor({ d, set, errFor, slideId, overrides }: EditorProps<TestimonialData>) {
  return (
    <div className="space-y-4">
      <ImageUploadField label="Avatar (opzionale)" value={d.avatarUrl} onChange={(url) => set({ ...d, avatarUrl: url })} variant="avatar" />
      <Field label="Citazione" error={errFor("quote")} slideId={slideId} fieldPath="quote" overrides={overrides}>
        <Textarea data-field="quote" rows={4} value={d.quote} onChange={(e) => set({ ...d, quote: e.target.value })} />
      </Field>
      <p className="text-[10px] text-muted-foreground">{d.quote.length}/{LIMITS.quoteMax} caratteri (min {LIMITS.quoteMin})</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Autore" error={errFor("author")} slideId={slideId} fieldPath="author" overrides={overrides}><Input data-field="author" maxLength={LIMITS.authorMax} value={d.author} onChange={(e) => set({ ...d, author: e.target.value })} /></Field>
        <Field label="Ruolo" slideId={slideId} fieldPath="role" overrides={overrides}><Input value={d.role ?? ""} onChange={(e) => set({ ...d, role: e.target.value })} /></Field>
      </div>
      <Field label="Rating (0-5, opzionale)" error={errFor("rating")}>
        <Input type="number" min={0} max={5} step={1} value={d.rating ?? 0} onChange={(e) => set({ ...d, rating: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })} />
      </Field>
    </div>
  );
}

/* ---------------- Myth ---------------- */
function MythEditor({ d, set, errFor, slideId, overrides }: EditorProps<MythData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mito (falso)</div>
        <Input value={d.myth.label} onChange={(e) => set({ ...d, myth: { ...d.myth, label: e.target.value } })} placeholder="MITO" />
        <Field label="Testo del mito" error={errFor("myth.text")} slideId={slideId} fieldPath="myth.text" overrides={overrides}>
          <Textarea data-field="myth.text" rows={2} value={d.myth.text} onChange={(e) => set({ ...d, myth: { ...d.myth, text: e.target.value } })} />
        </Field>
      </div>
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Realtà (vero)</div>
        <Input value={d.reality.label} onChange={(e) => set({ ...d, reality: { ...d.reality, label: e.target.value } })} placeholder="REALTÀ" />
        <Field label="Testo della realtà" error={errFor("reality.text")} slideId={slideId} fieldPath="reality.text" overrides={overrides}>
          <Textarea data-field="reality.text" rows={2} value={d.reality.text} onChange={(e) => set({ ...d, reality: { ...d.reality, text: e.target.value } })} />
        </Field>
      </div>
      <Field label="Fonte (opzionale)"><Input value={d.source ?? ""} onChange={(e) => set({ ...d, source: e.target.value })} placeholder="FONTE — REPORT 2025" /></Field>
    </div>
  );
}

/* ---------------- Process ---------------- */
function ProcessEditor({ d, set, errFor, slideId, overrides }: EditorProps<ProcessData>) {
  const stepsErr = errFor("steps");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {stepsErr && <p data-field="steps" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {stepsErr}</p>}
      <ArrayField
        label={`Step (${LIMITS.processSteps.min}–${LIMITS.processSteps.max})`}
        items={d.steps}
        onChange={(arr) => set({ ...d, steps: arr })}
        maxItems={LIMITS.processSteps.max}
        counter={<ItemCounter current={d.steps.length} min={LIMITS.processSteps.min} max={LIMITS.processSteps.max} unit="step" />}
        render={(v, on, i) => {
          const titleErr = errFor(`steps.${i}.title`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`steps.${i}.title`} value={overrides?.[`steps.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`steps.${i}.title`} value={overrides?.[`steps.${i}.title`]} />
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <Input value={v.number ?? ""} onChange={(e) => on({ ...v, number: e.target.value })} placeholder={`0${i + 1}`} />
                <Input data-field={`steps.${i}.title`} className={titleErr ? "border-destructive" : ""} value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo step *" />
              </div>
              <Textarea rows={2} value={v.desc} onChange={(e) => on({ ...v, desc: e.target.value })} placeholder="Descrizione" />
              {titleErr && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {titleErr}</p>}
            </div>
          );
        }}
        empty={{ number: "", title: "", desc: "" }}
      />
    </div>
  );
}

/* ---------------- Pros & Cons ---------------- */
function ProsConsEditor({ d, set, errFor, slideId, overrides }: EditorProps<ProsConsData>) {
  const prosErr = errFor("pros");
  const consErr = errFor("cons");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etichetta PRO"><Input value={d.prosLabel ?? "PRO"} onChange={(e) => set({ ...d, prosLabel: e.target.value })} /></Field>
        <Field label="Etichetta CONTRO"><Input value={d.consLabel ?? "CONTRO"} onChange={(e) => set({ ...d, consLabel: e.target.value })} /></Field>
      </div>
      {prosErr && <p data-field="pros" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {prosErr}</p>}
      <ArrayField
        label={`PRO (${LIMITS.prosCons.min}–${LIMITS.prosCons.max})`}
        items={d.pros}
        onChange={(arr) => set({ ...d, pros: arr })}
        maxItems={LIMITS.prosCons.max}
        counter={<ItemCounter current={d.pros.length} min={LIMITS.prosCons.min} max={LIMITS.prosCons.max} unit="pro" />}
        render={(v, on, i) => {
          const e = errFor(`pros.${i}`);
          return <Input data-field={`pros.${i}`} className={e ? "border-destructive" : ""} value={v} onChange={(ev) => on(ev.target.value)} placeholder={`Pro ${i + 1}`} />;
        }}
        empty=""
      />
      {consErr && <p data-field="cons" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {consErr}</p>}
      <ArrayField
        label={`CONTRO (${LIMITS.prosCons.min}–${LIMITS.prosCons.max})`}
        items={d.cons}
        onChange={(arr) => set({ ...d, cons: arr })}
        maxItems={LIMITS.prosCons.max}
        counter={<ItemCounter current={d.cons.length} min={LIMITS.prosCons.min} max={LIMITS.prosCons.max} unit="contro" />}
        render={(v, on, i) => {
          const e = errFor(`cons.${i}`);
          return <Input data-field={`cons.${i}`} className={e ? "border-destructive" : ""} value={v} onChange={(ev) => on(ev.target.value)} placeholder={`Contro ${i + 1}`} />;
        }}
        empty=""
      />
    </div>
  );
}

/* ---------------- Quote Big ---------------- */
function QuoteBigEditor({ d, set, errFor, slideId, overrides }: EditorProps<QuoteBigData>) {
  return (
    <div className="space-y-4">
      <Field label="Citazione" hint={`min ${LIMITS.quoteMin}, max ${LIMITS.quoteMax} caratteri`} error={errFor("quote")} slideId={slideId} fieldPath="quote" overrides={overrides}>
        <Textarea data-field="quote" rows={4} value={d.quote} onChange={(e) => set({ ...d, quote: e.target.value })} />
      </Field>
      <p className="text-[10px] text-muted-foreground">{d.quote.length}/{LIMITS.quoteMax}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Autore" error={errFor("author")} slideId={slideId} fieldPath="author" overrides={overrides}><Input data-field="author" maxLength={LIMITS.authorMax} value={d.author} onChange={(e) => set({ ...d, author: e.target.value })} /></Field>
        <Field label="Ruolo" slideId={slideId} fieldPath="role" overrides={overrides}><Input value={d.role ?? ""} onChange={(e) => set({ ...d, role: e.target.value })} /></Field>
      </div>
      <ImageUploadField label="Avatar (opzionale)" value={d.avatarUrl} onChange={(url) => set({ ...d, avatarUrl: url })} variant="avatar" />
    </div>
  );
}

/* ---------------- Roadmap ---------------- */
function RoadmapEditor({ d, set, errFor, slideId, overrides }: EditorProps<RoadmapData>) {
  const msErr = errFor("milestones");
  const STATUS_LABELS: Record<RoadmapStatus, string> = {
    done: "✓ Completato",
    progress: "● In corso",
    planned: "○ Pianificato",
  };
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {msErr && <p data-field="milestones" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {msErr}</p>}
      <ArrayField
        label={`Milestone (${LIMITS.roadmap.min}–${LIMITS.roadmap.max})`}
        items={d.milestones}
        onChange={(arr) => set({ ...d, milestones: arr })}
        maxItems={LIMITS.roadmap.max}
        counter={<ItemCounter current={d.milestones.length} min={LIMITS.roadmap.min} max={LIMITS.roadmap.max} unit="milestone" />}
        render={(v, on, i) => {
          const titleErr = errFor(`milestones.${i}.title`);
          const periodErr = errFor(`milestones.${i}.period`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Milestone {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`milestones.${i}.title`} value={overrides?.[`milestones.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`milestones.${i}.title`} value={overrides?.[`milestones.${i}.title`]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  value={v.status}
                  onChange={(e) => on({ ...v, status: e.target.value as RoadmapStatus })}
                >
                  {(Object.keys(STATUS_LABELS) as RoadmapStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <Input data-field={`milestones.${i}.period`} className={periodErr ? "border-destructive" : ""} value={v.period} onChange={(e) => on({ ...v, period: e.target.value })} placeholder="Q1 2026 *" />
              </div>
              <Input data-field={`milestones.${i}.title`} className={titleErr ? "border-destructive" : ""} value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo *" />
              <Textarea rows={2} value={v.desc} onChange={(e) => on({ ...v, desc: e.target.value })} placeholder="Descrizione" />
              {(titleErr || periodErr) && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {titleErr || periodErr}</p>}
            </div>
          );
        }}
        empty={{ status: "planned" as RoadmapStatus, period: "", title: "", desc: "" }}
      />
    </div>
  );
}

/* ---------------- CTA ---------------- */
function CtaEditor({ d, set, errFor, slideId, overrides }: EditorProps<CtaData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow (opzionale)" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Headline" hint={HL_HINT} error={errFor("headline")} slideId={slideId} fieldPath="headline" overrides={overrides}>
        <Textarea data-field="headline" rows={2} maxLength={LIMITS.headlineMax} value={d.headline} onChange={(e) => set({ ...d, headline: e.target.value })} />
      </Field>
      <Field label="Sottotitolo (opzionale)" slideId={slideId} fieldPath="subtitle" overrides={overrides}>
        <Textarea rows={2} value={d.subtitle ?? ""} onChange={(e) => set({ ...d, subtitle: e.target.value })} />
      </Field>
      <Field label="Etichetta bottone" error={errFor("buttonLabel")} slideId={slideId} fieldPath="buttonLabel" overrides={overrides}>
        <Input data-field="buttonLabel" maxLength={LIMITS.buttonMax} value={d.buttonLabel} onChange={(e) => set({ ...d, buttonLabel: e.target.value })} placeholder="SALVA ORA →" />
      </Field>
      <Field label="Handle / URL (opzionale)"><Input value={d.handle ?? ""} onChange={(e) => set({ ...d, handle: e.target.value })} placeholder="@nomeutente" /></Field>
    </div>
  );
}

/* ---------------- Hook ---------------- */
function HookEditor({ d, set, errFor, slideId, overrides }: EditorProps<HookData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow (opzionale)" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} placeholder="LEGGI FINO ALLA FINE" /></Field>
      <Field label="Hook" hint={`${LIMITS.hookMin}-${LIMITS.hookMax} caratteri`} error={errFor("hook")} slideId={slideId} fieldPath="hook" overrides={overrides}>
        <Textarea data-field="hook" rows={3} maxLength={LIMITS.hookMax} value={d.hook} onChange={(e) => set({ ...d, hook: e.target.value })} placeholder="Il 90% sbaglia questo." />
      </Field>
      <p className="text-[10px] text-muted-foreground">{d.hook.length}/{LIMITS.hookMax}</p>
      <Field label="Sub-hook (opzionale)" slideId={slideId} fieldPath="subhook" overrides={overrides}>
        <Input value={d.subhook ?? ""} onChange={(e) => set({ ...d, subhook: e.target.value })} placeholder="E nessuno te lo dice." />
      </Field>
      <Field label="Etichetta swipe"><Input value={d.swipeLabel ?? ""} onChange={(e) => set({ ...d, swipeLabel: e.target.value })} placeholder="SCORRI →" /></Field>
    </div>
  );
}

/* ---------------- Problem / Solution ---------------- */
function ProblemSolutionEditor({ d, set, errFor, slideId, overrides }: EditorProps<ProblemSolutionData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problema</div>
        <Input value={d.problem.label} onChange={(e) => set({ ...d, problem: { ...d.problem, label: e.target.value } })} placeholder="IL PROBLEMA" />
        <Field label="Testo problema" error={errFor("problem.text")} slideId={slideId} fieldPath="problem.text" overrides={overrides}>
          <Textarea data-field="problem.text" rows={2} value={d.problem.text} onChange={(e) => set({ ...d, problem: { ...d.problem, text: e.target.value } })} />
        </Field>
      </div>
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soluzione</div>
        <Input value={d.solution.label} onChange={(e) => set({ ...d, solution: { ...d.solution, label: e.target.value } })} placeholder="LA SOLUZIONE" />
        <Field label="Testo soluzione" error={errFor("solution.text")} slideId={slideId} fieldPath="solution.text" overrides={overrides}>
          <Textarea data-field="solution.text" rows={2} value={d.solution.text} onChange={(e) => set({ ...d, solution: { ...d.solution, text: e.target.value } })} />
        </Field>
      </div>
    </div>
  );
}

/* ---------------- Mistakes ---------------- */
function MistakesEditor({ d, set, errFor, slideId, overrides }: EditorProps<MistakesData>) {
  const mErr = errFor("mistakes");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {mErr && <p data-field="mistakes" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {mErr}</p>}
      <ArrayField
        label={`Errori (${LIMITS.mistakes.min}–${LIMITS.mistakes.max})`}
        items={d.mistakes}
        onChange={(arr) => set({ ...d, mistakes: arr })}
        maxItems={LIMITS.mistakes.max}
        counter={<ItemCounter current={d.mistakes.length} min={LIMITS.mistakes.min} max={LIMITS.mistakes.max} unit="errori" />}
        render={(v, on, i) => {
          const tErr = errFor(`mistakes.${i}.title`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Errore {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`mistakes.${i}.title`} value={overrides?.[`mistakes.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`mistakes.${i}.title`} value={overrides?.[`mistakes.${i}.title`]} />
                </div>
              </div>
              <Input data-field={`mistakes.${i}.title`} className={tErr ? "border-destructive" : ""} value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo errore *" />
              <Textarea rows={2} value={v.why} onChange={(e) => on({ ...v, why: e.target.value })} placeholder="Perché è un errore" />
              {tErr && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {tErr}</p>}
            </div>
          );
        }}
        empty={{ title: "", why: "" }}
      />
    </div>
  );
}

/* ---------------- Framework ---------------- */
function FrameworkEditor({ d, set, errFor, slideId, overrides }: EditorProps<FrameworkData>) {
  const lErr = errFor("letters");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Acronimo" error={errFor("acronym")} slideId={slideId} fieldPath="acronym" overrides={overrides}>
        <Input data-field="acronym" value={d.acronym} onChange={(e) => set({ ...d, acronym: e.target.value })} placeholder="AIDA" />
      </Field>
      {lErr && <p data-field="letters" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {lErr}</p>}
      <ArrayField
        label={`Lettere (${LIMITS.frameworkLetters.min}–${LIMITS.frameworkLetters.max})`}
        items={d.letters}
        onChange={(arr) => set({ ...d, letters: arr })}
        maxItems={LIMITS.frameworkLetters.max}
        counter={<ItemCounter current={d.letters.length} min={LIMITS.frameworkLetters.min} max={LIMITS.frameworkLetters.max} unit="lettere" />}
        render={(v, on, i) => {
          const letterErr = errFor(`letters.${i}.letter`);
          const nameErr = errFor(`letters.${i}.name`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Lettera {i + 1}</Label>
              <div className="grid grid-cols-[60px_1fr] gap-2">
                <Input maxLength={LIMITS.letterMax} className={letterErr ? "border-destructive" : ""} value={v.letter} onChange={(e) => on({ ...v, letter: e.target.value })} placeholder="A" />
                <Input className={nameErr ? "border-destructive" : ""} value={v.name} onChange={(e) => on({ ...v, name: e.target.value })} placeholder="Nome esteso *" />
              </div>
              <Textarea rows={2} value={v.desc} onChange={(e) => on({ ...v, desc: e.target.value })} placeholder="Descrizione" />
              {(letterErr || nameErr) && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {letterErr || nameErr}</p>}
            </div>
          );
        }}
        empty={{ letter: "", name: "", desc: "" }}
      />
    </div>
  );
}

/* ---------------- Social Proof ---------------- */
function SocialProofEditor({ d, set, errFor, slideId, overrides }: EditorProps<SocialProofData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Cliente" error={errFor("clientName")} slideId={slideId} fieldPath="clientName" overrides={overrides}>
        <Input data-field="clientName" value={d.clientName} onChange={(e) => set({ ...d, clientName: e.target.value })} />
      </Field>
      <Field label="Tagline" error={errFor("tagline")} slideId={slideId} fieldPath="tagline" overrides={overrides}>
        <Textarea data-field="tagline" rows={2} value={d.tagline} onChange={(e) => set({ ...d, tagline: e.target.value })} />
      </Field>
      <ImageUploadField label="Logo (opzionale)" value={d.logoUrl} onChange={(url) => set({ ...d, logoUrl: url })} variant="avatar" />
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">3 Metriche</Label>
      {d.metrics.slice(0, 3).map((m, i) => {
        const valErr = errFor(`metrics.${i}.value`);
        const labErr = errFor(`metrics.${i}.label`);
        return (
          <div key={i} className="space-y-2 rounded-md border border-border p-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Metrica {i + 1}</Label>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <Input className={valErr ? "border-destructive" : ""} value={m.value} onChange={(e) => { const ms = [...d.metrics]; ms[i] = { ...m, value: e.target.value }; set({ ...d, metrics: ms }); }} placeholder="+340" />
              <Input value={m.unit ?? ""} onChange={(e) => { const ms = [...d.metrics]; ms[i] = { ...m, unit: e.target.value }; set({ ...d, metrics: ms }); }} placeholder="%" />
            </div>
            <Input className={labErr ? "border-destructive" : ""} value={m.label} onChange={(e) => { const ms = [...d.metrics]; ms[i] = { ...m, label: e.target.value }; set({ ...d, metrics: ms }); }} placeholder="Etichetta *" />
          </div>
        );
      })}
      <Field label="Sintesi (opzionale)" slideId={slideId} fieldPath="summary" overrides={overrides}>
        <Textarea rows={2} value={d.summary ?? ""} onChange={(e) => set({ ...d, summary: e.target.value })} />
      </Field>
    </div>
  );
}

/* ---------------- Offer ---------------- */
function OfferEditor({ d, set, errFor, slideId, overrides }: EditorProps<OfferData>) {
  const incErr = errFor("includes");
  return (
    <div className="space-y-4">
      <Field label="Badge (opzionale)"><Input value={d.badge ?? ""} onChange={(e) => set({ ...d, badge: e.target.value })} placeholder="OFFERTA LIMITATA" /></Field>
      <Field label="Nome prodotto" error={errFor("productName")} slideId={slideId} fieldPath="productName" overrides={overrides}>
        <Input data-field="productName" value={d.productName} onChange={(e) => set({ ...d, productName: e.target.value })} />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Prezzo vecchio"><Input value={d.priceOld ?? ""} onChange={(e) => set({ ...d, priceOld: e.target.value })} placeholder="297" /></Field>
        <Field label="Prezzo nuovo *" error={errFor("priceNew")} slideId={slideId} fieldPath="priceNew" overrides={overrides}>
          <Input data-field="priceNew" value={d.priceNew} onChange={(e) => set({ ...d, priceNew: e.target.value })} placeholder="147" />
        </Field>
        <Field label="Valuta"><Input value={d.currency ?? "€"} onChange={(e) => set({ ...d, currency: e.target.value })} /></Field>
      </div>
      {incErr && <p data-field="includes" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {incErr}</p>}
      <ArrayField
        label={`Inclusi (${LIMITS.offerIncludes.min}–${LIMITS.offerIncludes.max})`}
        items={d.includes}
        onChange={(arr) => set({ ...d, includes: arr })}
        maxItems={LIMITS.offerIncludes.max}
        counter={<ItemCounter current={d.includes.length} min={LIMITS.offerIncludes.min} max={LIMITS.offerIncludes.max} unit="inclusi" />}
        render={(v, on, i) => {
          const e = errFor(`includes.${i}`);
          return <Input data-field={`includes.${i}`} className={e ? "border-destructive" : ""} value={v} onChange={(ev) => on(ev.target.value)} placeholder={`Incluso ${i + 1}`} />;
        }}
        empty=""
      />
      <Field label="Etichetta CTA" error={errFor("ctaLabel")} slideId={slideId} fieldPath="ctaLabel" overrides={overrides}>
        <Input data-field="ctaLabel" maxLength={LIMITS.buttonMax} value={d.ctaLabel} onChange={(e) => set({ ...d, ctaLabel: e.target.value })} placeholder="ACQUISTA ORA →" />
      </Field>
      <Field label="Urgenza (opzionale)" slideId={slideId} fieldPath="urgency" overrides={overrides}>
        <Input value={d.urgency ?? ""} onChange={(e) => set({ ...d, urgency: e.target.value })} placeholder="Solo per i primi 50 — scade in 48h" />
      </Field>
    </div>
  );
}

/* ---------------- Objection ---------------- */
function ObjectionEditor({ d, set, errFor, slideId, overrides }: EditorProps<ObjectionData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow (opzionale)" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Obiezione" hint={`max ${LIMITS.objectionMax} caratteri`} error={errFor("objection")} slideId={slideId} fieldPath="objection" overrides={overrides}>
        <Textarea data-field="objection" rows={3} maxLength={LIMITS.objectionMax} value={d.objection} onChange={(e) => set({ ...d, objection: e.target.value })} />
      </Field>
      <Field label="Risposta" hint={`max ${LIMITS.objectionMax} caratteri`} error={errFor("answer")} slideId={slideId} fieldPath="answer" overrides={overrides}>
        <Textarea data-field="answer" rows={3} maxLength={LIMITS.objectionMax} value={d.answer} onChange={(e) => set({ ...d, answer: e.target.value })} />
      </Field>
      <Field label="Chiusura (opzionale)" slideId={slideId} fieldPath="signOff" overrides={overrides}>
        <Input value={d.signOff ?? ""} onChange={(e) => set({ ...d, signOff: e.target.value })} placeholder="P.S. provalo gratis" />
      </Field>
    </div>
  );
}

/* ---------------- Tip Pack ---------------- */
function TipPackEditor({ d, set, errFor, slideId, overrides }: EditorProps<TipPackData>) {
  const tErr = errFor("tips");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {tErr && <p data-field="tips" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {tErr}</p>}
      <ArrayField
        label={`Tip (${LIMITS.tips.min}–${LIMITS.tips.max})`}
        items={d.tips}
        onChange={(arr) => set({ ...d, tips: arr })}
        maxItems={LIMITS.tips.max}
        counter={<ItemCounter current={d.tips.length} min={LIMITS.tips.min} max={LIMITS.tips.max} unit="tip" />}
        render={(v, on, i) => {
          const titleErr = errFor(`tips.${i}.title`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tip {i + 1}</Label>
                <div className="flex items-center gap-1">
                  <FontSizeSlider compact slideId={slideId!} fieldPath={`tips.${i}.title`} value={overrides?.[`tips.${i}.title`]} />
                  <TextStylePopover slideId={slideId} fieldPath={`tips.${i}.title`} value={overrides?.[`tips.${i}.title`]} />
                </div>
              </div>
              <div className="grid grid-cols-[60px_1fr] gap-2">
                <Input value={v.icon ?? ""} onChange={(e) => on({ ...v, icon: e.target.value })} placeholder="⚡" />
                <Input data-field={`tips.${i}.title`} className={titleErr ? "border-destructive" : ""} value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo tip *" />
              </div>
              <Textarea rows={2} value={v.text} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Descrizione" />
              {titleErr && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {titleErr}</p>}
            </div>
          );
        }}
        empty={{ icon: "", title: "", text: "" }}
      />
      <Field label="Etichetta save"><Input value={d.saveLabel ?? ""} onChange={(e) => set({ ...d, saveLabel: e.target.value })} placeholder="SALVA QUESTO POST" /></Field>
    </div>
  );
}

/* ---------------- Urgency ---------------- */
function UrgencyEditor({ d, set, errFor, slideId, overrides }: EditorProps<UrgencyData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow (opzionale)" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} placeholder="URGENTE" />
      </Field>
      <Field label="Headline" hint={HL_HINT} error={errFor("headline")} slideId={slideId} fieldPath="headline" overrides={overrides}>
        <Textarea data-field="headline" rows={2} maxLength={LIMITS.headlineMax} value={d.headline} onChange={(e) => set({ ...d, headline: e.target.value })} placeholder="Le iscrizioni chiudono tra…" />
      </Field>
      <Field label="Countdown (testo)" hint="Es. 23:47:12 oppure 'tra 2 giorni'" error={errFor("deadline")} slideId={slideId} fieldPath="deadline" overrides={overrides}>
        <Input data-field="deadline" value={d.deadline} onChange={(e) => set({ ...d, deadline: e.target.value })} placeholder="23:47:12" />
      </Field>
      <Field label="Posti rimasti (opzionale)" slideId={slideId} fieldPath="unitsLeft" overrides={overrides}>
        <Input value={d.unitsLeft ?? ""} onChange={(e) => set({ ...d, unitsLeft: e.target.value })} placeholder="Solo 7 posti rimasti" />
      </Field>
      <Field label="Etichetta CTA" error={errFor("ctaLabel")} slideId={slideId} fieldPath="ctaLabel" overrides={overrides}>
        <Input data-field="ctaLabel" maxLength={LIMITS.buttonMax} value={d.ctaLabel} onChange={(e) => set({ ...d, ctaLabel: e.target.value })} placeholder="PRENOTA ORA →" />
      </Field>
    </div>
  );
}

/* ---------------- Bonus Stack ---------------- */
function BonusStackEditor({ d, set, errFor, slideId, overrides }: EditorProps<BonusStackData>) {
  const bErr = errFor("bonuses");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} placeholder="COSA RICEVI" />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      {bErr && <p data-field="bonuses" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {bErr}</p>}
      <ArrayField
        label="Bonus (1–6)"
        items={d.bonuses}
        onChange={(arr) => set({ ...d, bonuses: arr })}
        maxItems={6}
        counter={<ItemCounter current={d.bonuses.length} min={1} max={6} unit="bonus" />}
        render={(v, on, i) => {
          const nameErr = errFor(`bonuses.${i}.name`);
          const valErr = errFor(`bonuses.${i}.value`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bonus {i + 1}</Label>
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <Input data-field={`bonuses.${i}.name`} className={nameErr ? "border-destructive" : ""} value={v.name} onChange={(e) => on({ ...v, name: e.target.value })} placeholder="Nome bonus *" />
                <Input data-field={`bonuses.${i}.value`} className={valErr ? "border-destructive" : ""} value={v.value} onChange={(e) => on({ ...v, value: e.target.value })} placeholder="297" />
              </div>
              <Input value={v.description ?? ""} onChange={(e) => on({ ...v, description: e.target.value })} placeholder="Descrizione (opzionale)" />
              {(nameErr || valErr) && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {nameErr || valErr}</p>}
            </div>
          );
        }}
        empty={{ name: "", description: "", value: "" }}
      />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Valore totale" slideId={slideId} fieldPath="totalValue" overrides={overrides}>
          <Input value={d.totalValue} onChange={(e) => set({ ...d, totalValue: e.target.value })} placeholder="741" />
        </Field>
        <Field label="Prezzo finale *" error={errFor("yourPrice")} slideId={slideId} fieldPath="yourPrice" overrides={overrides}>
          <Input data-field="yourPrice" value={d.yourPrice} onChange={(e) => set({ ...d, yourPrice: e.target.value })} placeholder="147" />
        </Field>
        <Field label="Valuta">
          <Input value={d.currency ?? "€"} onChange={(e) => set({ ...d, currency: e.target.value })} />
        </Field>
      </div>
      <Field label="Etichetta CTA" error={errFor("ctaLabel")} slideId={slideId} fieldPath="ctaLabel" overrides={overrides}>
        <Input data-field="ctaLabel" maxLength={LIMITS.buttonMax} value={d.ctaLabel} onChange={(e) => set({ ...d, ctaLabel: e.target.value })} placeholder="VOGLIO TUTTO ORA →" />
      </Field>
    </div>
  );
}

/* ---------------- Guarantee ---------------- */
function GuaranteeEditor({ d, set, errFor, slideId, overrides }: EditorProps<GuaranteeData>) {
  return (
    <div className="space-y-4">
      <Field label="Badge (opzionale)">
        <Input value={d.badge ?? ""} onChange={(e) => set({ ...d, badge: e.target.value })} placeholder="100% SODDISFATTI" />
      </Field>
      <Field label="Sigillo / icona (emoji)" hint="Es. 🛡️ 🔒 ✅">
        <Input value={d.seal ?? ""} onChange={(e) => set({ ...d, seal: e.target.value })} placeholder="🛡️" />
      </Field>
      <Field label="Headline" hint={HL_HINT} error={errFor("headline")} slideId={slideId} fieldPath="headline" overrides={overrides}>
        <Textarea data-field="headline" rows={2} value={d.headline} onChange={(e) => set({ ...d, headline: e.target.value })} placeholder="Garanzia soddisfatti o rimborsati 30 giorni." />
      </Field>
      <Field label="Testo garanzia" error={errFor("body")} slideId={slideId} fieldPath="body" overrides={overrides}>
        <Textarea data-field="body" rows={4} value={d.body} onChange={(e) => set({ ...d, body: e.target.value })} placeholder="Provalo. Se entro 30 giorni…" />
      </Field>
      <Field label="Condizioni (opzionale)" slideId={slideId} fieldPath="terms" overrides={overrides}>
        <Input value={d.terms ?? ""} onChange={(e) => set({ ...d, terms: e.target.value })} placeholder="Basta una mail. Rimborso entro 48h." />
      </Field>
    </div>
  );
}

/* ---------------- FAQ ---------------- */
function FaqEditor({ d, set, errFor, slideId, overrides }: EditorProps<FaqData>) {
  const iErr = errFor("items");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} placeholder="DOMANDE FREQUENTI" />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      {iErr && <p data-field="items" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {iErr}</p>}
      <ArrayField
        label="Domande (2–6)"
        items={d.items}
        onChange={(arr) => set({ ...d, items: arr })}
        maxItems={6}
        counter={<ItemCounter current={d.items.length} min={2} max={6} unit="FAQ" />}
        render={(v, on, i) => {
          const qErr = errFor(`items.${i}.q`);
          const aErr = errFor(`items.${i}.a`);
          return (
            <div className="space-y-2 rounded-md border border-border p-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">FAQ {i + 1}</Label>
              <Input data-field={`items.${i}.q`} className={qErr ? "border-destructive" : ""} value={v.q} onChange={(e) => on({ ...v, q: e.target.value })} placeholder="Domanda *" />
              <Textarea data-field={`items.${i}.a`} className={aErr ? "border-destructive" : ""} rows={2} value={v.a} onChange={(e) => on({ ...v, a: e.target.value })} placeholder="Risposta *" />
              {(qErr || aErr) && <p className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {qErr || aErr}</p>}
            </div>
          );
        }}
        empty={{ q: "", a: "" }}
      />
    </div>
  );
}

/* ---------------- Quick Win ---------------- */
function QuickWinEditor({ d, set, errFor, slideId, overrides }: EditorProps<QuickWinData>) {
  const sErr = errFor("steps");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow (opzionale)" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} placeholder="PROVA SUBITO" />
      </Field>
      <Field label="Badge tempo (opzionale)" slideId={slideId} fieldPath="timeBadge" overrides={overrides}>
        <Input value={d.timeBadge ?? ""} onChange={(e) => set({ ...d, timeBadge: e.target.value })} placeholder="60 sec" />
      </Field>
      <Field label="Istruzione" hint={HL_HINT} error={errFor("instruction")} slideId={slideId} fieldPath="instruction" overrides={overrides}>
        <Textarea data-field="instruction" rows={2} value={d.instruction} onChange={(e) => set({ ...d, instruction: e.target.value })} placeholder="Cambia la bio di Instagram in 60 secondi." />
      </Field>
      {sErr && <p data-field="steps" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {sErr}</p>}
      <ArrayField
        label="Step (1–5)"
        items={d.steps}
        onChange={(arr) => set({ ...d, steps: arr })}
        maxItems={5}
        counter={<ItemCounter current={d.steps.length} min={1} max={5} unit="step" />}
        render={(v, on, i) => {
          const e = errFor(`steps.${i}`);
          return (
            <Input data-field={`steps.${i}`} className={e ? "border-destructive" : ""} value={v} onChange={(ev) => on(ev.target.value)} placeholder={`Step ${i + 1} *`} />
          );
        }}
        empty=""
      />
      <Field label="Risultato atteso (opzionale)" slideId={slideId} fieldPath="expectedResult" overrides={overrides}>
        <Input value={d.expectedResult ?? ""} onChange={(e) => set({ ...d, expectedResult: e.target.value })} placeholder="+30% di click sul link in bio" />
      </Field>
    </div>
  );
}

/* ===================== NEW WOW EDITORS ===================== */

function MediaHeroEditor({ d, set, errFor, slideId, overrides }: EditorProps<MediaHeroData>) {
  return (
    <div className="space-y-4">
      <ImageUploadField label="Foto fullbleed" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Foto verticale ad alta risoluzione per massimo impatto." />
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} placeholder="STORY" />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      <Field label="Sottotitolo (opzionale)" slideId={slideId} fieldPath="subtitle" overrides={overrides}>
        <Input value={d.subtitle ?? ""} onChange={(e) => set({ ...d, subtitle: e.target.value })} />
      </Field>
      <Field label="CTA (opzionale)" slideId={slideId} fieldPath="ctaLabel" overrides={overrides}>
        <Input value={d.ctaLabel ?? ""} onChange={(e) => set({ ...d, ctaLabel: e.target.value })} placeholder="SCOPRI →" />
      </Field>
      <Field label="Intensità overlay">
        <div className="flex gap-2">
          {(["soft", "strong"] as const).map((v) => (
            <Button key={v} type="button" size="sm" variant={d.overlayIntensity === v ? "default" : "outline"} onClick={() => set({ ...d, overlayIntensity: v })}>
              {v === "soft" ? "Soft" : "Strong"}
            </Button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function PolaroidStackEditor({ d, set, errFor, slideId, overrides }: EditorProps<PolaroidStackData>) {
  const pErr = errFor("polaroids");
  const polaroids = d.polaroids ?? [];
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title ?? ""} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      {pErr && <p data-field="polaroids" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {pErr}</p>}
      <ArrayField
        label="Polaroid (1–3)"
        items={polaroids}
        onChange={(arr) => set({ ...d, polaroids: arr })}
        maxItems={3}
        counter={<ItemCounter current={polaroids.length} min={1} max={3} unit="polaroid" />}
        render={(v, on, i) => (
          <div className="space-y-2 rounded-md border border-border p-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Polaroid {i + 1}</Label>
            <ImageUploadField label="" value={v.url} onChange={(url) => on({ ...v, url })} />
            <Input value={v.caption ?? ""} onChange={(e) => on({ ...v, caption: e.target.value })} placeholder="Caption" />
            <Input value={v.date ?? ""} onChange={(e) => on({ ...v, date: e.target.value })} placeholder="Mag 2025" />
          </div>
        )}
        empty={{ url: undefined, caption: "", date: "" }}
      />
    </div>
  );
}

function SplitDuoEditor({ d, set, errFor, slideId, overrides }: EditorProps<SplitDuoData>) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow ?? ""} onChange={(e) => set({ ...d, eyebrow: e.target.value })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-md border border-border p-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sinistra</Label>
          <ImageUploadField label="" value={d.leftImage.url} onChange={(url) => set({ ...d, leftImage: { ...d.leftImage, url } })} />
          <Field label="Etichetta" error={errFor("leftImage.label")} slideId={slideId} fieldPath="leftImage.label" overrides={overrides}>
            <Input data-field="leftImage.label" value={d.leftImage.label} onChange={(e) => set({ ...d, leftImage: { ...d.leftImage, label: e.target.value } })} placeholder="PRIMA" />
          </Field>
        </div>
        <div className="space-y-2 rounded-md border border-border p-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destra</Label>
          <ImageUploadField label="" value={d.rightImage.url} onChange={(url) => set({ ...d, rightImage: { ...d.rightImage, url } })} />
          <Field label="Etichetta" error={errFor("rightImage.label")} slideId={slideId} fieldPath="rightImage.label" overrides={overrides}>
            <Input data-field="rightImage.label" value={d.rightImage.label} onChange={(e) => set({ ...d, rightImage: { ...d.rightImage, label: e.target.value } })} placeholder="DOPO" />
          </Field>
        </div>
      </div>
      <Field label="Badge centrale" error={errFor("centerBadge")} slideId={slideId} fieldPath="centerBadge" overrides={overrides}>
        <Input data-field="centerBadge" value={d.centerBadge} onChange={(e) => set({ ...d, centerBadge: e.target.value })} placeholder="VS" />
      </Field>
      <Field label="Caption (opzionale)" slideId={slideId} fieldPath="caption" overrides={overrides}>
        <Input value={d.caption ?? ""} onChange={(e) => set({ ...d, caption: e.target.value })} />
      </Field>
    </div>
  );
}

function MagazineCoverEditor({ d, set, errFor, slideId, overrides }: EditorProps<MagazineCoverData>) {
  const cErr = errFor("coverLines");
  return (
    <div className="space-y-4">
      <Field label="Masthead" error={errFor("masthead")} slideId={slideId} fieldPath="masthead" overrides={overrides}>
        <Input data-field="masthead" value={d.masthead} onChange={(e) => set({ ...d, masthead: e.target.value })} placeholder="VOGUE" />
      </Field>
      <Field label="Numero / Data" slideId={slideId} fieldPath="issueLabel" overrides={overrides}>
        <Input value={d.issueLabel ?? ""} onChange={(e) => set({ ...d, issueLabel: e.target.value })} placeholder="N° 12 · Nov 2025" />
      </Field>
      <ImageUploadField label="Foto centrale" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} />
      <Field label="Headline principale" hint={HL_HINT} error={errFor("mainHeadline")} slideId={slideId} fieldPath="mainHeadline" overrides={overrides}>
        <Textarea data-field="mainHeadline" rows={2} value={d.mainHeadline} onChange={(e) => set({ ...d, mainHeadline: e.target.value })} />
      </Field>
      {cErr && <p data-field="coverLines" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {cErr}</p>}
      <ArrayField
        label="Cover lines (1–4)"
        items={d.coverLines}
        onChange={(arr) => set({ ...d, coverLines: arr })}
        maxItems={4}
        counter={<ItemCounter current={d.coverLines.length} min={1} max={4} unit="strilli" />}
        render={(v, on, i) => (
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Input value={v.text} onChange={(e) => on({ ...v, text: e.target.value })} placeholder={`Strillo ${i + 1}`} />
            <Input value={v.pageRef ?? ""} onChange={(e) => on({ ...v, pageRef: e.target.value })} placeholder="p. 12" />
          </div>
        )}
        empty={{ text: "", pageRef: "" }}
      />
    </div>
  );
}

function ChartAreaEditor({ d, set, errFor, slideId, overrides }: EditorProps<ChartAreaData>) {
  const vErr = errFor("values");
  const updatePair = (i: number, lb?: string, val?: number) => {
    const xLabels = [...d.xLabels];
    const values = [...d.values];
    if (lb !== undefined) xLabels[i] = lb;
    if (val !== undefined) values[i] = val;
    set({ ...d, xLabels, values });
  };
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Unità (es. k)"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
        <Field label="Trend">
          <div className="flex gap-2">
            {(["up", "down"] as const).map((t) => (
              <Button key={t} type="button" size="sm" variant={d.trend === t ? "default" : "outline"} onClick={() => set({ ...d, trend: t })}>
                {t === "up" ? "▲ Up" : "▼ Down"}
              </Button>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Etichetta picco" slideId={slideId} fieldPath="peakLabel" overrides={overrides}>
        <Input value={d.peakLabel ?? ""} onChange={(e) => set({ ...d, peakLabel: e.target.value })} placeholder="Picco virale" />
      </Field>
      {vErr && <p data-field="values" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {vErr}</p>}
      <ArrayField
        label="Punti (3–24)"
        items={d.values.map((v, i) => ({ x: d.xLabels[i] ?? "", v }))}
        onChange={(arr) => set({ ...d, xLabels: arr.map((p) => p.x), values: arr.map((p) => p.v) })}
        maxItems={24}
        counter={<ItemCounter current={d.values.length} min={3} max={24} unit="punti" />}
        render={(v, on, i) => (
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <Input value={v.x} onChange={(e) => { on({ ...v, x: e.target.value }); updatePair(i, e.target.value); }} placeholder="Etichetta X" />
            <Input type="number" value={v.v} onChange={(e) => { const nv = Number(e.target.value); on({ ...v, v: nv }); updatePair(i, undefined, nv); }} />
          </div>
        )}
        empty={{ x: "", v: 0 }}
      />
    </div>
  );
}

function ChartCompareBarEditor({ d, set, errFor, slideId, overrides }: EditorProps<ChartCompareBarData>) {
  const rErr = errFor("rows");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Serie A — label" error={errFor("seriesA.label")}>
          <Input data-field="seriesA.label" value={d.seriesA.label} onChange={(e) => set({ ...d, seriesA: { ...d.seriesA, label: e.target.value } })} />
        </Field>
        <Field label="Serie A — colore (#hex)" error={errFor("seriesA.color")}>
          <Input value={d.seriesA.color ?? ""} onChange={(e) => set({ ...d, seriesA: { ...d.seriesA, color: e.target.value || undefined } })} placeholder="#00E5FF" />
        </Field>
        <Field label="Serie B — label" error={errFor("seriesB.label")}>
          <Input data-field="seriesB.label" value={d.seriesB.label} onChange={(e) => set({ ...d, seriesB: { ...d.seriesB, label: e.target.value } })} />
        </Field>
        <Field label="Serie B — colore (#hex)" error={errFor("seriesB.color")}>
          <Input value={d.seriesB.color ?? ""} onChange={(e) => set({ ...d, seriesB: { ...d.seriesB, color: e.target.value || undefined } })} placeholder="#B24BF3" />
        </Field>
      </div>
      <Field label="Unità"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      {rErr && <p data-field="rows" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {rErr}</p>}
      <ArrayField
        label="Righe (2–6)"
        items={d.rows}
        onChange={(arr) => set({ ...d, rows: arr })}
        maxItems={6}
        counter={<ItemCounter current={d.rows.length} min={2} max={6} unit="righe" />}
        render={(v, on, i) => {
          const lErr = errFor(`rows.${i}.label`);
          return (
            <div className="space-y-1 rounded-md border border-border p-2">
              <Input data-field={`rows.${i}.label`} className={lErr ? "border-destructive" : ""} value={v.label} onChange={(e) => on({ ...v, label: e.target.value })} placeholder={`Categoria ${i + 1}`} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" value={v.valueA} onChange={(e) => on({ ...v, valueA: Number(e.target.value) })} placeholder="A" />
                <Input type="number" value={v.valueB} onChange={(e) => on({ ...v, valueB: Number(e.target.value) })} placeholder="B" />
              </div>
            </div>
          );
        }}
        empty={{ label: "", valueA: 0, valueB: 0 }}
      />
    </div>
  );
}

function KpiGridEditor({ d, set, errFor, slideId, overrides }: EditorProps<KpiGridData>) {
  const kErr = errFor("kpis");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      {kErr && <p data-field="kpis" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {kErr}</p>}
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">4 KPI (esattamente)</Label>
      {d.kpis.map((k, i) => {
        const update = (patch: Partial<typeof k>) => {
          const arr = [...d.kpis];
          arr[i] = { ...k, ...patch };
          set({ ...d, kpis: arr });
        };
        return (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">KPI {i + 1}</Label>
            <Input data-field={`kpis.${i}.label`} value={k.label} onChange={(e) => update({ label: e.target.value })} placeholder="Etichetta *" />
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <Input data-field={`kpis.${i}.value`} value={k.value} onChange={(e) => update({ value: e.target.value })} placeholder="Valore *" />
              <Input value={k.unit ?? ""} onChange={(e) => update({ unit: e.target.value })} placeholder="unit" />
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <Input data-field={`kpis.${i}.delta`} value={k.delta} onChange={(e) => update({ delta: e.target.value })} placeholder="+24% *" />
              <select
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                value={k.trend}
                onChange={(e) => update({ trend: e.target.value as "up" | "down" | "flat" })}
              >
                <option value="up">▲ Up</option>
                <option value="down">▼ Down</option>
                <option value="flat">■ Flat</option>
              </select>
            </div>
            <Input
              value={k.spark.join(", ")}
              onChange={(e) => update({ spark: e.target.value.split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n)) })}
              placeholder="Sparkline: 12, 18, 22, 28, 34, 41"
            />
          </div>
        );
      })}
    </div>
  );
}

function FunnelChartEditor({ d, set, errFor, slideId, overrides }: EditorProps<FunnelChartData>) {
  const sErr = errFor("stages");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}>
        <Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} />
      </Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}>
        <Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} />
      </Field>
      {sErr && <p data-field="stages" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {sErr}</p>}
      <ArrayField
        label="Stadi (2–5)"
        items={d.stages}
        onChange={(arr) => set({ ...d, stages: arr })}
        maxItems={5}
        counter={<ItemCounter current={d.stages.length} min={2} max={5} unit="stadi" />}
        render={(v, on, i) => {
          const lErr = errFor(`stages.${i}.label`);
          const vErr = errFor(`stages.${i}.value`);
          return (
            <div className="space-y-1 rounded-md border border-border p-2">
              <Input data-field={`stages.${i}.label`} className={lErr ? "border-destructive" : ""} value={v.label} onChange={(e) => on({ ...v, label: e.target.value })} placeholder={`Stadio ${i + 1} *`} />
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <Input data-field={`stages.${i}.value`} className={vErr ? "border-destructive" : ""} value={v.value} onChange={(e) => on({ ...v, value: e.target.value })} placeholder="Valore *" />
                <Input value={v.conversionPercent ?? ""} onChange={(e) => on({ ...v, conversionPercent: e.target.value })} placeholder="12%" />
              </div>
            </div>
          );
        }}
        empty={{ label: "", value: "", conversionPercent: "" }}
      />
      <Field label="Sintesi (opzionale)" slideId={slideId} fieldPath="summary" overrides={overrides}>
        <Textarea rows={2} value={d.summary ?? ""} onChange={(e) => set({ ...d, summary: e.target.value })} />
      </Field>
    </div>
  );
}