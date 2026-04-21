import { useCarousel } from "@/lib/store";
import type { Slide, SplitData, Grid2x2Data, BigNumData, CenterData, TimelineData, CompareData, VocabData, QAData, ChecklistData, StatData } from "@/lib/templates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";

interface Props { slide: Slide }

export function SlideEditorForm({ slide }: Props) {
  const update = useCarousel((s) => s.updateSlide);
  const set = (data: Slide["data"]) => update(slide.id, data);

  switch (slide.template) {
    case "split":     return <SplitEditor d={slide.data as SplitData} set={set} />;
    case "grid2x2":   return <GridEditor d={slide.data as Grid2x2Data} set={set} />;
    case "bignum":    return <BigNumEditor d={slide.data as BigNumData} set={set} />;
    case "center":    return <CenterEditor d={slide.data as CenterData} set={set} />;
    case "timeline":  return <TimelineEditor d={slide.data as TimelineData} set={set} />;
    case "compare":   return <CompareEditor d={slide.data as CompareData} set={set} />;
    case "vocab":     return <VocabEditor d={slide.data as VocabData} set={set} />;
    case "qa":        return <QAEditor d={slide.data as QAData} set={set} />;
    case "checklist": return <ChecklistEditor d={slide.data as ChecklistData} set={set} />;
    case "stat":      return <StatEditor d={slide.data as StatData} set={set} />;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const HL_HINT = "Usa {hl}testo{/hl} per evidenziare in colore accent";

/* ---------------- Split ---------------- */
function SplitEditor({ d, set }: { d: SplitData; set: (d: SplitData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT}><Textarea rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
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
function GridEditor({ d, set }: { d: Grid2x2Data; set: (d: Grid2x2Data) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT}><Textarea rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">4 Riquadri</Label>
      {d.cells.map((c, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border p-3">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <Input value={c.num} onChange={(e) => { const cells = [...d.cells]; cells[i] = { ...c, num: e.target.value }; set({ ...d, cells }); }} placeholder="01" />
            <Input value={c.title} onChange={(e) => { const cells = [...d.cells]; cells[i] = { ...c, title: e.target.value }; set({ ...d, cells }); }} placeholder="Titolo" />
          </div>
          <Textarea rows={2} value={c.text} onChange={(e) => { const cells = [...d.cells]; cells[i] = { ...c, text: e.target.value }; set({ ...d, cells }); }} placeholder="Testo" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- BigNum ---------------- */
function BigNumEditor({ d, set }: { d: BigNumData; set: (d: BigNumData) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numero"><Input value={d.number} onChange={(e) => set({ ...d, number: e.target.value })} /></Field>
        <Field label="Sottotitolo numero"><Input value={d.numberSub} onChange={(e) => set({ ...d, numberSub: e.target.value })} /></Field>
      </div>
      <Field label="Titolo" hint={HL_HINT}><Textarea rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ArrayField label="Paragrafi" items={d.paragraphs} onChange={(arr) => set({ ...d, paragraphs: arr })}
        render={(v, on) => <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />} empty="" />
    </div>
  );
}

/* ---------------- Center ---------------- */
function CenterEditor({ d, set }: { d: CenterData; set: (d: CenterData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Frase principale" hint={HL_HINT}><Textarea rows={3} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Sottotitolo"><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- Timeline ---------------- */
function TimelineEditor({ d, set }: { d: TimelineData; set: (d: TimelineData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT}><Textarea rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <ArrayField label="Step" items={d.items} onChange={(arr) => set({ ...d, items: arr })}
        render={(v, on) => (
          <div className="space-y-2">
            <Input value={v.when} onChange={(e) => on({ ...v, when: e.target.value })} placeholder="GIORNO 01" />
            <Input value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Titolo step" />
            <Textarea rows={2} value={v.text} onChange={(e) => on({ ...v, text: e.target.value })} placeholder="Descrizione" />
          </div>
        )}
        empty={{ when: "", title: "", text: "" }}
      />
    </div>
  );
}

/* ---------------- Compare ---------------- */
function CompareEditor({ d, set }: { d: CompareData; set: (d: CompareData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT}><Textarea rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      {(["before", "after"] as const).map((side) => (
        <div key={side} className="space-y-2 rounded-md border border-border p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{side === "before" ? "Prima" : "Dopo (in evidenza)"}</div>
          <Input value={d[side].tag} onChange={(e) => set({ ...d, [side]: { ...d[side], tag: e.target.value } })} placeholder="TAG" />
          <Input value={d[side].title} onChange={(e) => set({ ...d, [side]: { ...d[side], title: e.target.value } })} placeholder="Titolo colonna" />
          <ArrayField label="Voci" items={d[side].items}
            onChange={(items) => set({ ...d, [side]: { ...d[side], items } })}
            render={(v, on) => <Input value={v} onChange={(e) => on(e.target.value)} />} empty="" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Vocab ---------------- */
function VocabEditor({ d, set }: { d: VocabData; set: (d: VocabData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Categoria"><Input value={d.category} onChange={(e) => set({ ...d, category: e.target.value })} /></Field>
      <Field label="Parola"><Input value={d.word} onChange={(e) => set({ ...d, word: e.target.value })} /></Field>
      <Field label="Pronuncia / categoria gramm."><Input value={d.pron} onChange={(e) => set({ ...d, pron: e.target.value })} /></Field>
      <Field label="Etichetta definizione"><Input value={d.defLabel} onChange={(e) => set({ ...d, defLabel: e.target.value })} /></Field>
      <Field label="Definizione"><Textarea rows={3} value={d.def} onChange={(e) => set({ ...d, def: e.target.value })} /></Field>
      <Field label="Esempio / citazione"><Textarea rows={2} value={d.example} onChange={(e) => set({ ...d, example: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- QA ---------------- */
function QAEditor({ d, set }: { d: QAData; set: (d: QAData) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etichetta Q"><Input value={d.qLabel} onChange={(e) => set({ ...d, qLabel: e.target.value })} /></Field>
        <Field label="Etichetta A"><Input value={d.aLabel} onChange={(e) => set({ ...d, aLabel: e.target.value })} /></Field>
      </div>
      <Field label="Domanda"><Textarea rows={2} value={d.question} onChange={(e) => set({ ...d, question: e.target.value })} /></Field>
      <ArrayField label="Risposta (paragrafi)" items={d.answer} onChange={(arr) => set({ ...d, answer: arr })}
        render={(v, on) => <Textarea rows={2} value={v} onChange={(e) => on(e.target.value)} />} empty="" />
    </div>
  );
}

/* ---------------- Checklist ---------------- */
function ChecklistEditor({ d, set }: { d: ChecklistData; set: (d: ChecklistData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={d.eyebrow} onChange={(e) => set({ ...d, eyebrow: e.target.value })} /></Field>
      <Field label="Titolo" hint={HL_HINT}><Textarea rows={2} value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Meta (es. '5 PASSI · 10 MIN')"><Input value={d.meta} onChange={(e) => set({ ...d, meta: e.target.value })} /></Field>
      <ArrayField label="Voci" items={d.items} onChange={(arr) => set({ ...d, items: arr })}
        render={(v, on) => (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch checked={v.done} onCheckedChange={(c) => on({ ...v, done: c })} />
              <span className="text-xs text-muted-foreground">Fatto</span>
            </div>
            <Input value={v.title} onChange={(e) => on({ ...v, title: e.target.value })} placeholder="Voce" />
            <Input value={v.note ?? ""} onChange={(e) => on({ ...v, note: e.target.value })} placeholder="Nota (opzionale)" />
          </div>
        )}
        empty={{ done: false, title: "", note: "" }}
      />
    </div>
  );
}

/* ---------------- Stat ---------------- */
function StatEditor({ d, set }: { d: StatData; set: (d: StatData) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Etichetta"><Input value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} /></Field>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Valore"><Input value={d.value} onChange={(e) => set({ ...d, value: e.target.value })} /></Field>
        <Field label="Unità"><Input value={d.unit ?? ""} onChange={(e) => set({ ...d, unit: e.target.value })} /></Field>
      </div>
      <Field label="Sottotitolo"><Textarea rows={2} value={d.sub ?? ""} onChange={(e) => set({ ...d, sub: e.target.value })} /></Field>
      <Field label="Nota / fonte"><Input value={d.note ?? ""} onChange={(e) => set({ ...d, note: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------- ArrayField helper ---------------- */
function ArrayField<T>({ label, items, onChange, render, empty }: {
  label: string;
  items: T[];
  onChange: (arr: T[]) => void;
  render: (value: T, onItemChange: (v: T) => void) => React.ReactNode;
  empty: T;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1">{render(it, (v) => { const arr = [...items]; arr[i] = v; onChange(arr); })}</div>
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
