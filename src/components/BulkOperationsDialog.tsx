import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wand2, Replace, RotateCcw } from "lucide-react";
import { useCarousel } from "@/lib/store";
import { toast } from "sonner";

/**
 * Operazioni "in massa" su tutto il carosello: trova/sostituisci testo,
 * reset di tutti gli override font/colore. Pensato per pulire/rinominare
 * un carosello in 1 click invece di slide per slide.
 */
export function BulkOperationsDialog() {
  const [open, setOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const replaceTextInAllSlides = useCarousel((s) => s.replaceTextInAllSlides);
  const clearAllTextOverrides = useCarousel((s) => s.clearAllTextOverrides);

  const onReplace = () => {
    if (!findText.trim()) {
      toast.error("Inserisci il testo da cercare");
      return;
    }
    const n = replaceTextInAllSlides(findText, replaceText, caseSensitive);
    if (n === 0) toast.info("Nessuna occorrenza trovata");
    else toast.success(`${n} occorrenze sostituite`);
    setFindText("");
    setReplaceText("");
  };

  const onResetStyles = () => {
    clearAllTextOverrides();
    toast.success("Tutti gli stili manuali rimossi (font/colori tornano ai default del template)");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Operazioni su tutto il carosello">
          <Wand2 className="mr-1 h-4 w-4" /> Bulk
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Operazioni in massa</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="replace">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="replace" className="gap-1.5">
              <Replace className="h-4 w-4" /> Trova / Sostituisci
            </TabsTrigger>
            <TabsTrigger value="reset" className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset stili
            </TabsTrigger>
          </TabsList>

          <TabsContent value="replace" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Sostituisce il testo in TUTTI i campi di TUTTE le slide. Utile per cambiare nome
              prodotto, prezzo, brand mentioning, ecc.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-find">Trova</Label>
              <Input
                id="bulk-find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="es. Vecchio Brand"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-replace">Sostituisci con</Label>
              <Input
                id="bulk-replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="es. Nuovo Brand"
              />
            </div>
            <Label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Distingui maiuscole/minuscole
            </Label>
            <Button onClick={onReplace} disabled={!findText.trim()}>
              <Replace className="mr-1 h-4 w-4" /> Sostituisci ovunque
            </Button>
          </TabsContent>

          <TabsContent value="reset" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Rimuove tutte le personalizzazioni manuali di font-size e colori che hai applicato
              alle singole slide. Le slide tornano ai default del loro template (e brand).
            </p>
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs">
              ⚠️ Questa operazione è reversibile con ⌘Z, ma rimuove TUTTI gli override di stile
              di TUTTE le slide del carosello in un colpo solo.
            </div>
            <Button variant="destructive" onClick={onResetStyles}>
              <RotateCcw className="mr-1 h-4 w-4" /> Reset stili a default
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
