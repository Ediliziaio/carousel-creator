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

  let body: React.ReactNode = null;
  switch (slide.template) {
    case "split":     body = <SplitEditor d={draft as SplitData} set={set as (d: SplitData) => void} errFor={errFor} />; break;
    case "grid2x2":   body = <GridEditor d={draft as Grid2x2Data} set={set as (d: Grid2x2Data) => void} errFor={errFor} />; break;
    case "bignum":    body = <BigNumEditor d={draft as BigNumData} set={set as (d: BigNumData) => void} errFor={errFor} />; break;
    case "center":    body = <CenterEditor d={draft as CenterData} set={set as (d: CenterData) => void} errFor={errFor} />; break;
    case "timeline":  body = <TimelineEditor d={draft as TimelineData} set={set as (d: TimelineData) => void} errFor={errFor} />; break;
    case "compare":   body = <CompareEditor d={draft as CompareData} set={set as (d: CompareData) => void} errFor={errFor} />; break;
    case "vocab":     body = <VocabEditor d={draft as VocabData} set={set as (d: VocabData) => void} errFor={errFor} />; break;
    case "qa":        body = <QAEditor d={draft as QAData} set={set as (d: QAData) => void} errFor={errFor} />; break;
    case "checklist": body = <ChecklistEditor d={draft as ChecklistData} set={set as (d: ChecklistData) => void} errFor={errFor} />; break;
    case "stat":      body = <StatEditor d={draft as StatData} set={set as (d: StatData) => void} errFor={errFor} />; break;
    case "cover":     body = <CoverEditor d={draft as CoverData} set={set as (d: CoverData) => void} errFor={errFor} />; break;
  }

  return (
    <div ref={containerRef} className="space-y-4">
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

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={`text-xs uppercase tracking-wider ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {label}{error && " *"}
      </Label>
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
function SplitEditor({ d, set, errFor }: { d: SplitData; set: (d: SplitData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ImageUploadField label="Immagine (opzionale)" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Se presente, sostituisce paragrafi/lista a destra." />
      <ArrayField
        label="Paragrafi"
        items={d.paragraphs ?? []}
        onChange={(arr) => set({ ...d, paragraphs: arr })}
        render={(v, on) => <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />}
        empty=""
      />
      <ArrayField
        label="Lista"
        items={d.list ?? []}
        onChange={(arr) => set({ ...d, list: arr })}
        render={(v, on) => (
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <Input value={v.marker} onChange={(e) => on({ ...v, marker: e.target.value })} placeholder="01" />
            <Input value={v.text} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Voce" />
          </div>
        )}
        empty={{ marker: "", text: "" }}
      />
    </div>
  );
}

/* ---------------- Grid 2x2 ---------------- */
function GridEditor({ d, set, errFor }: { d: Grid2x2Data; set: (d: Grid2x2Data) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">4 Riquadri</Label>
      {d.cells.map((c, i) => {
        const cellErr = errFor(`cells.${i}.title`);
        return (
          <div key={i} className={`space-y-2 rounded-md border p-3 ${cellErr ? "border-destructive" : "border-border"}`}>
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
function BigNumEditor({ d, set, errFor }: { d: BigNumData; set: (d: BigNumData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numero" error={errFor("number")}><Input data-field="number" value={d.number} onChange={(e) => set({ ...d, number: e.target.value })} /></Field>
        <Field label="Sottotitolo numero"><Input value={d.numberSub} onChange={(e) => set({ ...d, numberSub: e.target.value })} /></Field>
      </div>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ArrayField label="Paragrafi" items={d.paragraphs} onChange={(arr) => set({ ...d, paragraphs: arr })}
        render={(v, on) => <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />} empty="" />
    </div>
  );
}

/* ---------------- Center ---------------- */
function CenterEditor({ d, set, errFor }: { d: CenterData; set: (d: CenterData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Frase principale" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={3} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Sottotitolo"><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
      <ImageUploadField label="Immagine di sfondo (opzionale)" value={d.imageUrl} onChange={(url) => set({ ...d, imageUrl: url })} hint="Renderizzata sfocata sotto il testo." />
    </div>
  );
}

/* ---------------- Timeline ---------------- */
function TimelineEditor({ d, set, errFor }: { d: TimelineData; set: (d: TimelineData) => void; errFor: ErrFor }) {
  const itemsErr = errFor("items");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {itemsErr && <p data-field="items" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {itemsErr}</p>}
      <ArrayField label="Step" items={d.items} onChange={(arr) => set({ ...d, items: arr })}
        render={(v, on, i) => {
          const itemTitleErr = errFor(`items.${i}.title`);
          return (
            <div className="space-y-2">
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
function CompareEditor({ d, set, errFor }: { d: CompareData; set: (d: CompareData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {(["before", "after"] as const).map((side) => {
        const titleErr = errFor(`${side}.title`);
        const itemsErr = errFor(`${side}.items`);
        return (
          <div key={side} className={`space-y-2 rounded-md border p-3 ${titleErr || itemsErr ? "border-destructive" : "border-border"}`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{side === "before" ? "Prima" : "Dopo (in evidenza)"}</div>
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
function VocabEditor({ d, set, errFor }: { d: VocabData; set: (d: VocabData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Categoria"><Input value={d.category} onChange={(e) => set({ ...d, category: e.target.value })} /></Field>
      <Field label="Parola" error={errFor("word")}><Input data-field="word" value={d.word} onChange={(e) => set({ ...d, word: e.target.value })} /></Field>
      <Field label="Pronuncia / categoria gramm."><Input value={d.pron} onChange={(e) => set({ ...d, pron: e.target.value })} /></Field>
      <Field label="Etichetta definizione"><Input value={d.defLabel} onChange={(e) => set({ ...d, defLabel: e.target.value })} /></Field>
      <Field label="Definizione" error={errFor("def")}><Textarea data-field="def" rows={3} value={d.def} onChange={(e) => set({ ...d, def: e.target.value })} /></Field>
      <Field label="Esempio / citazione"><Textarea rows={2} value={d.example} onChange={(e) => set({ ...d, example: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- QA ---------------- */
function QAEditor({ d, set, errFor }: { d: QAData; set: (d: QAData) => void; errFor: ErrFor }) {
  const answerErr = errFor("answer");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etichetta Q"><Input value={d.qLabel} onChange={(e) => set({ ...d, qLabel: e.target.value })} /></Field>
        <Field label="Etichetta A"><Input value={d.aLabel} onChange={(e) => set({ ...d, aLabel: e.target.value })} /></Field>
      </div>
      <Field label="Domanda" error={errFor("question")}><Textarea data-field="question" rows={2} value={d.question} onChange={(e) => set({ ...d, question: e.target.value })} /></Field>
      {answerErr && <p data-field="answer" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {answerErr}</p>}
      <ArrayField label="Risposta (paragrafi)" items={d.answer} onChange={(arr) => set({ ...d, answer: arr })}
        render={(v, on, i) => {
          const pErr = errFor(`answer.${i}`);
          return <Textarea data-field={`answer.${i}`} rows={2} value={v} className={pErr ? "border-destructive" : ""} onChange={(e) => on(e.target.value)} />;
        }} empty="" />
    </div>
  );
}

/* ---------------- Checklist ---------------- */
function ChecklistEditor({ d, set, errFor }: { d: ChecklistData; set: (d: ChecklistData) => void; errFor: ErrFor }) {
  const itemsErr = errFor("items");
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Meta (es. '5 PASSI · 10 MIN')"><Input value={d.meta} onChange={(e) => set({ ...d, meta: e.target.value })} /></Field>
      {itemsErr && <p data-field="items" className="flex items-center gap-1 text-[11px] text-destructive"><AlertCircle className="h-3 w-3" /> {itemsErr}</p>}
      <ArrayField label="Voci" items={d.items} onChange={(arr) => set({ ...d, items: arr })}
        render={(v, on, i) => {
          const itemTitleErr = errFor(`items.${i}.title`);
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={v.done} onCheckedChange={(c) => on({ ...v, done: c })} />
                <span className="text-xs text-muted-foreground">Fatto</span>
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
function StatEditor({ d, set, errFor }: { d: StatData; set: (d: StatData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Etichetta" error={errFor("label")}><Input data-field="label" value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} /></Field>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Valore" error={errFor("value")}><Input data-field="value" value={d.value} onChange={(e) => set({ ...d, value: e.target.value })} /></Field>
        <Field label="Unità"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      </div>
      <Field label="Sottotitolo"><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
      <Field label="Nota / fonte"><Input value={d.note ?? ""} onChange={(e) => set({ ...d, note: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- Cover ---------------- */
function CoverEditor({ d, set, errFor }: { d: CoverData; set: (d: CoverData) => void; errFor: ErrFor }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT} error={errFor("title")}><Textarea data-field="title" rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Sottotitolo"><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
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
