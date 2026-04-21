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
import { langLabel } from "@/lib/i18n";
import { Trash2, Plus, AlertCircle } from "lucide-react";

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

  const errors = useMemo(
    () => validateSlideData(slide.template, draft).errors,
    [slide.template, draft],
  );
  const errFor = (field: string) => errors.find((e) => e.field === field)?.message;

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

  let body: React.ReactNode = null;
  switch (slide.template) {
    case "split":       body = <SplitEditor d={draft as SplitData} set={set as (d: SplitData) => void} errFor={errFor} {...styleProps} />; break;
    case "grid2x2":     body = <GridEditor d={draft as Grid2x2Data} set={set as (d: Grid2x2Data) => void} errFor={errFor} {...styleProps} />; break;
    case "bignum":      body = <BigNumEditor d={draft as BigNumData} set={set as (d: BigNumData) => void} errFor={errFor} {...styleProps} />; break;
    case "center":      body = <CenterEditor d={draft as CenterData} set={set as (d: CenterData) => void} errFor={errFor} {...styleProps} />; break;
    case "timeline":    body = <TimelineEditor d={draft as TimelineData} set={set as (d: TimelineData) => void} errFor={errFor} {...styleProps} />; break;
    case "compare":     body = <CompareEditor d={draft as CompareData} set={set as (d: CompareData) => void} errFor={errFor} {...styleProps} />; break;
    case "vocab":       body = <VocabEditor d={draft as VocabData} set={set as (d: VocabData) => void} errFor={errFor} {...styleProps} />; break;
    case "qa":          body = <QAEditor d={draft as QAData} set={set as (d: QAData) => void} errFor={errFor} {...styleProps} />; break;
    case "checklist":   body = <ChecklistEditor d={draft as ChecklistData} set={set as (d: ChecklistData) => void} errFor={errFor} {...styleProps} />; break;
    case "stat":        body = <StatEditor d={draft as StatData} set={set as (d: StatData) => void} errFor={errFor} {...styleProps} />; break;
    case "cover":       body = <CoverEditor d={draft as CoverData} set={set as (d: CoverData) => void} errFor={errFor} {...styleProps} />; break;
    case "gallery":     body = <GalleryEditor d={draft as GalleryData} set={set as (d: GalleryData) => void} errFor={errFor} {...styleProps} />; break;
    case "imageQuote":  body = <ImageQuoteEditor d={draft as ImageQuoteData} set={set as (d: ImageQuoteData) => void} errFor={errFor} {...styleProps} />; break;
    case "chartBar":    body = <ChartBarEditor d={draft as ChartBarData} set={set as (d: ChartBarData) => void} errFor={errFor} {...styleProps} />; break;
    case "chartDonut":  body = <ChartDonutEditor d={draft as ChartDonutData} set={set as (d: ChartDonutData) => void} errFor={errFor} {...styleProps} />; break;
    case "chartLine":   body = <ChartLineEditor d={draft as ChartLineData} set={set as (d: ChartLineData) => void} errFor={errFor} {...styleProps} />; break;
    case "feature":     body = <FeatureEditor d={draft as FeatureData} set={set as (d: FeatureData) => void} errFor={errFor} {...styleProps} />; break;
    case "testimonial": body = <TestimonialEditor d={draft as TestimonialData} set={set as (d: TestimonialData) => void} errFor={errFor} {...styleProps} />; break;
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
type StyleProps = { slideId: string; overrides?: Record<string, import("@/lib/templates").TextStyle> };

function Field({ label, hint, error, slideId, fieldPath, overrides, children }: {
  label: string;
  hint?: string;
  error?: string;
  slideId?: string;
  fieldPath?: string;
  overrides?: Record<string, import("@/lib/templates").TextStyle>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className={`text-xs uppercase tracking-wider ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {label}{error && " *"}
        </Label>
        {slideId && fieldPath && (
          <TextStylePopover slideId={slideId} fieldPath={fieldPath} value={overrides?.[fieldPath]} />
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
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const HL_HINT = "Usa {hl}testo{/hl} per evidenziare in colore accent";

/* ---------------- Split ---------------- */
function SplitEditor({ d, set, errFor, slideId, overrides }: { d: SplitData; set: (d: SplitData) => void; errFor: ErrFor } & StyleProps) {
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
              <TextStylePopover slideId={slideId} fieldPath={`paragraphs.${i}`} value={overrides?.[`paragraphs.${i}`]} />
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
              <TextStylePopover slideId={slideId} fieldPath={`list.${i}.text`} value={overrides?.[`list.${i}.text`]} />
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
function GridEditor({ d, set, errFor, slideId, overrides }: { d: Grid2x2Data; set: (d: Grid2x2Data) => void; errFor: ErrFor } & StyleProps) {
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
              <div className="flex gap-1">
                <TextStylePopover slideId={slideId} fieldPath={`cells.${i}.title`} value={overrides?.[`cells.${i}.title`]} />
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
function BigNumEditor({ d, set, errFor, slideId, overrides }: { d: BigNumData; set: (d: BigNumData) => void; errFor: ErrFor } & StyleProps) {
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
              <TextStylePopover slideId={slideId} fieldPath={`paragraphs.${i}`} value={overrides?.[`paragraphs.${i}`]} />
            </div>
            <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />
          </div>
        )} empty="" />
    </div>
  );
}

/* ---------------- Center ---------------- */
function CenterEditor({ d, set, errFor, slideId, overrides }: { d: CenterData; set: (d: CenterData) => void; errFor: ErrFor } & StyleProps) {
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
function TimelineEditor({ d, set, errFor, slideId, overrides }: { d: TimelineData; set: (d: TimelineData) => void; errFor: ErrFor } & StyleProps) {
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
                <TextStylePopover slideId={slideId} fieldPath={`items.${i}.title`} value={overrides?.[`items.${i}.title`]} />
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
function CompareEditor({ d, set, errFor, slideId, overrides }: { d: CompareData; set: (d: CompareData) => void; errFor: ErrFor } & StyleProps) {
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
              <TextStylePopover slideId={slideId} fieldPath={`${side}.title`} value={overrides?.[`${side}.title`]} />
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
function VocabEditor({ d, set, errFor, slideId, overrides }: { d: VocabData; set: (d: VocabData) => void; errFor: ErrFor } & StyleProps) {
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
function QAEditor({ d, set, errFor, slideId, overrides }: { d: QAData; set: (d: QAData) => void; errFor: ErrFor } & StyleProps) {
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
                <TextStylePopover slideId={slideId} fieldPath={`answer.${i}`} value={overrides?.[`answer.${i}`]} />
              </div>
              <Textarea data-field={`answer.${i}`} rows={2} value={v} className={pErr ? "border-destructive" : ""} onChange={(e) => on(e.target.value)} />
            </div>
          );
        }} empty="" />
    </div>
  );
}

/* ---------------- Checklist ---------------- */
function ChecklistEditor({ d, set, errFor, slideId, overrides }: { d: ChecklistData; set: (d: ChecklistData) => void; errFor: ErrFor } & StyleProps) {
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
                <TextStylePopover slideId={slideId} fieldPath={`items.${i}.title`} value={overrides?.[`items.${i}.title`]} />
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
function StatEditor({ d, set, errFor, slideId, overrides }: { d: StatData; set: (d: StatData) => void; errFor: ErrFor } & StyleProps) {
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
function CoverEditor({ d, set, errFor, slideId, overrides }: { d: CoverData; set: (d: CoverData) => void; errFor: ErrFor } & StyleProps) {
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
function ArrayField<T>({ label, items, onChange, render, empty }: {
  label: string;
  items: T[];
  onChange: (arr: T[]) => void;
  render: (value: T, onItemChange: (v: T) => void, index: number) => React.ReactNode;
  empty: T;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
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
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, structuredClone(empty)])}>
        <Plus className="h-4 w-4 mr-1" /> Aggiungi
      </Button>
    </div>
  );
}

/* ---------------- Gallery ---------------- */
function GalleryEditor({ d, set, errFor, slideId, overrides }: { d: GalleryData; set: (d: GalleryData) => void; errFor: ErrFor } & StyleProps) {
  const imgsErr = errFor("images");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {imgsErr && <p data-field="images" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {imgsErr}</p>}
      <ArrayField
        label="Immagini (3 consigliate)"
        items={d.images}
        onChange={(arr) => set({ ...d, images: arr })}
        render={(v, on, i) => (
          <div className="space-y-2 rounded-md border border-border p-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Foto {i + 1}</Label>
              <TextStylePopover slideId={slideId} fieldPath={`images.${i}.caption`} value={overrides?.[`images.${i}.caption`]} />
            </div>
            <ImageUploadField label="" value={v.url} onChange={(url) => on({ ...v, url })} />
            <Input value={v.caption ?? ""} onChange={(e) => on({ ...v, caption: e.target.value })} placeholder="Didascalia (opzionale)" />
          </div>
        )}
        empty={{ url: undefined, caption: "" }}
      />
    </div>
  );
}

/* ---------------- ImageQuote ---------------- */
function ImageQuoteEditor({ d, set, errFor, slideId, overrides }: { d: ImageQuoteData; set: (d: ImageQuoteData) => void; errFor: ErrFor } & StyleProps) {
  return (
    <div className="space-y-4">
      <ImageUploadField label="Immagine fullscreen" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Renderizzata sotto la citazione." />
      <Field label="Citazione" error={errFor("quote")} slideId={slideId} fieldPath="quote" overrides={overrides}><Textarea data-field="quote" rows={4} value={d.quote} onChange={(e) => set({ ...d, quote: e.target.value })} /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Autore" error={errFor("author")} slideId={slideId} fieldPath="author" overrides={overrides}><Input data-field="author" value={d.author} onChange={(e) => set({ ...d, author: e.target.value })} /></Field>
        <Field label="Ruolo" slideId={slideId} fieldPath="role" overrides={overrides}><Input value={d.role ?? ""} onChange={(e) => set({ ...d, role: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/* ---------------- ChartBar ---------------- */
function ChartBarEditor({ d, set, errFor, slideId, overrides }: { d: ChartBarData; set: (d: ChartBarData) => void; errFor: ErrFor } & StyleProps) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Unità (opzionale)"><Input value={d.unit ?? ""} placeholder="%, k€…" onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      <ArrayField
        label="Voci (max 6)"
        items={d.items}
        onChange={(arr) => set({ ...d, items: arr.slice(0, 6) })}
        render={(v, on, i) => (
          <div className="space-y-2 rounded-md border border-border p-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Voce {i + 1}</Label>
              <TextStylePopover slideId={slideId} fieldPath={`items.${i}.label`} value={overrides?.[`items.${i}.label`]} />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_100px_50px]">
              <Input className="col-span-2 sm:col-span-1" value={v.label} onChange={(e) => on({ ...v, label: e.target.value })} placeholder="Etichetta" />
              <Input type="number" value={v.value} onChange={(e) => on({ ...v, value: Number(e.target.value) || 0 })} placeholder="0" />
              <Input type="color" value={v.color ?? "#00E5FF"} onChange={(e) => on({ ...v, color: e.target.value })} className="h-9 w-full p-1" />
            </div>
          </div>
        )}
        empty={{ label: "Nuovo", value: 0 }}
      />
    </div>
  );
}

/* ---------------- ChartDonut ---------------- */
function ChartDonutEditor({ d, set, errFor, slideId, overrides }: { d: ChartDonutData; set: (d: ChartDonutData) => void; errFor: ErrFor } & StyleProps) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Etichetta al centro (opzionale)"><Input value={d.centerLabel ?? ""} onChange={(e) => set({ ...d, centerLabel: e.target.value })} /></Field>
      <ArrayField
        label="Segmenti (max 6)"
        items={d.segments}
        onChange={(arr) => set({ ...d, segments: arr.slice(0, 6) })}
        render={(v, on, i) => (
          <div className="space-y-2 rounded-md border border-border p-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Segmento {i + 1}</Label>
              <TextStylePopover slideId={slideId} fieldPath={`segments.${i}.label`} value={overrides?.[`segments.${i}.label`]} />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_100px_50px]">
              <Input className="col-span-2 sm:col-span-1" value={v.label} onChange={(e) => on({ ...v, label: e.target.value })} placeholder="Etichetta" />
              <Input type="number" value={v.value} onChange={(e) => on({ ...v, value: Number(e.target.value) || 0 })} placeholder="0" />
              <Input type="color" value={v.color ?? "#00E5FF"} onChange={(e) => on({ ...v, color: e.target.value })} className="h-9 w-full p-1" />
            </div>
          </div>
        )}
        empty={{ label: "Nuovo", value: 0 }}
      />
    </div>
  );
}

/* ---------------- ChartLine ---------------- */
function ChartLineEditor({ d, set, errFor, slideId, overrides }: { d: ChartLineData; set: (d: ChartLineData) => void; errFor: ErrFor } & StyleProps) {
  const updatePoint = (i: number, label: string, value: number) => {
    const xLabels = [...d.xLabels]; const values = [...d.values];
    xLabels[i] = label; values[i] = value;
    set({ ...d, xLabels, values });
  };
  const addPoint = () => set({ ...d, xLabels: [...d.xLabels, `P${d.xLabels.length + 1}`], values: [...d.values, 0] });
  const removePoint = (i: number) => set({ ...d, xLabels: d.xLabels.filter((_, j) => j !== i), values: d.values.filter((_, j) => j !== i) });
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Unità (opzionale)"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Punti dati</Label>
        {d.xLabels.map((lb, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row">
            <Input className="flex-1" value={lb} onChange={(e) => updatePoint(i, e.target.value, d.values[i] ?? 0)} placeholder="Etichetta X" />
            <div className="flex gap-2">
              <Input className="flex-1 sm:w-24 sm:flex-none" type="number" value={d.values[i] ?? 0} onChange={(e) => updatePoint(i, lb, Number(e.target.value) || 0)} placeholder="0" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removePoint(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPoint}><Plus className="mr-1 h-4 w-4" /> Aggiungi punto</Button>
      </div>
    </div>
  );
}

/* ---------------- Feature ---------------- */
function FeatureEditor({ d, set, errFor, slideId, overrides }: { d: FeatureData; set: (d: FeatureData) => void; errFor: ErrFor } & StyleProps) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow" slideId={slideId} fieldPath="eyebrow" overrides={overrides}><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")} slideId={slideId} fieldPath="title" overrides={overrides}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ImageUploadField label="Immagine spotlight" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} />
      <ArrayField
        label="Bullet (3 consigliati)"
        items={d.bullets}
        onChange={(arr) => set({ ...d, bullets: arr })}
        render={(v, on, i) => (
          <div className="space-y-2 rounded-md border border-border p-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bullet {i + 1}</Label>
              <TextStylePopover slideId={slideId} fieldPath={`bullets.${i}.title`} value={overrides?.[`bullets.${i}.title`]} />
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-2 sm:grid-cols-[80px_1fr]">
              <Input value={v.marker} onChange={(e) => on({ ...v, marker: e.target.value })} placeholder="01" />
              <Input value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo" />
            </div>
            <Textarea rows={2} value={v.text ?? ""} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Descrizione (opzionale)" />
          </div>
        )}
        empty={{ marker: "", title: "", text: "" }}
      />
    </div>
  );
}

/* ---------------- Testimonial ---------------- */
function TestimonialEditor({ d, set, errFor, slideId, overrides }: { d: TestimonialData; set: (d: TestimonialData) => void; errFor: ErrFor } & StyleProps) {
  return (
    <div className="space-y-4">
      <ImageUploadField label="Avatar (opzionale)" value={d.avatarUrl} onChange={(url) => set({ ...d, avatarUrl: url })} variant="avatar" />
      <Field label="Citazione" error={errFor("quote")} slideId={slideId} fieldPath="quote" overrides={overrides}><Textarea data-field="quote" rows={4} value={d.quote} onChange={(e) => set({ ...d, quote: e.target.value })} /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Autore" error={errFor("author")} slideId={slideId} fieldPath="author" overrides={overrides}><Input data-field="author" value={d.author} onChange={(e) => set({ ...d, author: e.target.value })} /></Field>
        <Field label="Ruolo" slideId={slideId} fieldPath="role" overrides={overrides}><Input value={d.role ?? ""} onChange={(e) => set({ ...d, role: e.target.value })} /></Field>
      </div>
      <Field label="Rating (0-5, opzionale)">
        <Input type="number" min={0} max={5} value={d.rating ?? 0} onChange={(e) => set({ ...d, rating: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })} />
      </Field>
    </div>
  );
}
