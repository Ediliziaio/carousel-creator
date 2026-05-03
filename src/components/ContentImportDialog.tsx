import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  parseContentBundle,
  parseSimpleCsv,
  SAMPLE_BUNDLES,
  type ImportResult,
} from "@/lib/contentImport";
import { parseTextToSlides, CLAUDE_PROJECT_PROMPT } from "@/lib/textToSlides";
import { Sparkles, BotMessageSquare } from "lucide-react";
import { useCarousel } from "@/lib/store";
import { TEMPLATE_META } from "@/lib/templates";
import { toast } from "sonner";

export function ContentImportDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "json" | "csv">("text");
  const importContentBundle = useCarousel((s) => s.importContentBundle);
  const slides = useCarousel((s) => s.slides);

  const parsed: ImportResult | null = useMemo(() => {
    if (!text.trim()) return null;
    if (mode === "text") return parseTextToSlides(text);
    if (mode === "csv") return parseSimpleCsv(text);
    try {
      const json = JSON.parse(text);
      return parseContentBundle(json);
    } catch (e) {
      return { items: [], errors: ["JSON non valido: " + (e as Error).message] };
    }
  }, [text, mode]);

  const onFile = async (file: File) => {
    const t = await file.text();
    setText(t);
    setMode(file.name.endsWith(".csv") ? "csv" : "json");
  };

  const apply = (kind: "replace" | "append") => {
    if (!parsed || parsed.items.length === 0) {
      toast.error("Nessuna slide da importare");
      return;
    }
    if (
      kind === "replace" &&
      slides.length > 0 &&
      !confirm(`Sostituire le ${slides.length} slide attuali con ${parsed.items.length} nuove?`)
    )
      return;
    importContentBundle(parsed.items, kind);
    const warnCount = parsed.items.reduce((n, it) => n + it.warnings.length, 0);
    toast.success(
      `${parsed.items.length} slide importate${warnCount > 0 ? ` (${warnCount} warning)` : ""}`,
    );
    setOpen(false);
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-1 h-4 w-4" /> Da testo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Genera slide da testo / JSON / CSV</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "json" | "csv")}>
          <TabsList>
            <TabsTrigger value="text" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Testo (auto)
            </TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv">CSV semplice</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              Incolla un testo strutturato (brief, articolo, script). Ogni{" "}
              <code className="rounded bg-muted px-1">## titolo</code> apre una nuova slide.
              Liste, numeri prominenti e CTA vengono riconosciuti automaticamente.
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="mb-1 font-medium text-foreground">
                💡 Workflow consigliato (zero costi API)
              </div>
              <p className="text-muted-foreground">
                Crea un Project su <strong>Claude.ai</strong> (o un GPT su ChatGPT) con il
                prompt sotto: scrivi <em>"fammi un carosello su X"</em>, copi la risposta,
                la incolli qui e ottieni le slide pronte. Costo: solo il tuo abbonamento
                mensile, nessun token a consumo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(CLAUDE_PROJECT_PROMPT);
                    toast.success(
                      "Prompt copiato. Incollalo come 'Custom instructions' del Claude Project.",
                    );
                  } catch {
                    toast.error("Impossibile accedere agli appunti");
                  }
                }}
              >
                <BotMessageSquare className="mr-1 h-4 w-4" /> Copia prompt per Claude/ChatGPT
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setText(
                    `# Come scrivere caroselli che convertono\n\n## Il problema\nLa maggior parte dei caroselli viene saltata in 2 secondi.\nIl motivo? Mancano i fondamentali.\n\n## I 4 fondamentali\n- Hook potente nelle prime 3 parole\n- Una sola idea per slide\n- Numeri concreti, non aggettivi\n- Call to action chiara alla fine\n\n## Il dato che cambia tutto\n73% degli utenti decide se continuare nei primi 3 secondi.\n\n## CTA\nSeguimi per altri consigli sui contenuti che convertono.`,
                  )
                }
              >
                Carica esempio
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="json" className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              Formato:{" "}
              <code className="rounded bg-muted px-1">{`[{ "template": "hook", "data": { "hook": "..." } }]`}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_BUNDLES.map((s) => (
                <Button key={s.name} size="sm" variant="outline" onClick={() => setText(s.json)}>
                  Esempio: {s.name}
                </Button>
              ))}
              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
                <Button asChild size="sm" variant="outline">
                  <span>Carica file .json</span>
                </Button>
              </label>
            </div>
          </TabsContent>
          <TabsContent value="csv" className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              Formato: <code className="rounded bg-muted px-1">template,field,value</code> (una riga
              per campo). Supporta path con punto (es. <code>problem.text</code>).
            </div>
            <label className="inline-flex">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              <Button asChild size="sm" variant="outline">
                <span>Carica file .csv</span>
              </Button>
            </label>
          </TabsContent>
        </Tabs>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={mode === "text" ? 14 : 10}
          className={`mt-3 ${mode === "text" ? "text-sm" : "font-mono text-xs"}`}
          placeholder={
            mode === "text"
              ? "# Titolo del carosello\n\n## Prima slide\nIl tuo testo qui...\n\n## Punti chiave\n- Punto 1\n- Punto 2\n- Punto 3\n\n## CTA\nIscriviti alla newsletter"
              : mode === "json"
                ? '[\n  { "template": "hook", "data": { "hook": "..." } }\n]'
                : "hook,hook,Stai sbagliando questo\nhook,subhook,E nessuno te lo dice"
          }
        />

        {parsed && (
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Anteprima — {parsed.items.length} slide, {parsed.errors.length} errori
            </div>
            {parsed.errors.length > 0 && (
              <ul className="mb-2 list-disc pl-5 text-xs text-destructive">
                {parsed.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            <ul className="space-y-1 text-sm">
              {parsed.items.map((it, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${it.warnings.length > 0 ? "bg-yellow-500/20 text-yellow-700" : "bg-green-500/20 text-green-700"}`}
                  >
                    {it.warnings.length > 0 ? "WARN" : "OK"}
                  </span>
                  Slide {(i + 1).toString().padStart(2, "0")} · {TEMPLATE_META[it.template].label}
                  {it.warnings.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({it.warnings.length} warning)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button
            variant="outline"
            onClick={() => apply("append")}
            disabled={!parsed || parsed.items.length === 0}
          >
            Aggiungi alla fine
          </Button>
          <Button onClick={() => apply("replace")} disabled={!parsed || parsed.items.length === 0}>
            Sostituisci tutto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
