import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Image as ImageIcon, Package, Loader2, AlertTriangle } from "lucide-react";
import { useCarousel } from "@/lib/store";
import { validateAllSlides, type SlideValidationResult } from "@/lib/validation";
import { downloadSinglePng, downloadZipFromNodes } from "@/lib/export";
import { toast } from "sonner";

interface Props {
  exportRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  activeSlideId: string | null;
  activeIndex: number;
  brandTitle: string;
  onError: (message: string) => void;
}

type Mode = "single" | "zip";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "carosello";
}

export function ExportButton({ exportRefs, activeSlideId, activeIndex, brandTitle, onError }: Props) {
  const slides = useCarousel((s) => s.slides);
  const setActive = useCarousel((s) => s.setActive);

  const [exporting, setExporting] = useState<null | Mode>(null);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [validationIssues, setValidationIssues] = useState<SlideValidationResult[]>([]);
  const [forceExport, setForceExport] = useState(false);

  const runExport = async (mode: Mode) => {
    setExporting(mode);
    try {
      let method;
      if (mode === "single") {
        if (!activeSlideId) return;
        const node = exportRefs.current.get(activeSlideId);
        if (!node) throw new Error("Slide attiva non trovata nel DOM di export.");
        const num = (activeIndex + 1).toString().padStart(2, "0");
        method = await downloadSinglePng(node, `${slugify(brandTitle)}-slide-${num}.png`);
        toast.success("PNG esportata");
      } else {
        const nodes = slides
          .map((s) => exportRefs.current.get(s.id))
          .filter((n): n is HTMLDivElement => !!n);
        if (nodes.length === 0) throw new Error("Nessuna slide pronta per l'export.");
        method = await downloadZipFromNodes(nodes, slugify(brandTitle));
        toast.success(`${nodes.length} PNG esportate in ZIP`);
      }
      if (method === "new-tab") {
        toast.info("Download bloccato dal browser: file aperto in una nuova tab. Tasto destro → Salva immagine come...");
      }
    } catch (e) {
      const msg = (e as Error).message || "Errore sconosciuto";
      toast.error("Errore export: " + msg);
      onError(msg);
    } finally {
      setExporting(null);
    }
  };

  const handleClick = (mode: Mode) => {
    const issues = validateAllSlides(slides);
    if (issues.length > 0) {
      setValidationIssues(issues);
      setPendingMode(mode);
      setForceExport(false);
      return;
    }
    void runExport(mode);
  };

  const closeDialog = () => {
    setPendingMode(null);
    setValidationIssues([]);
    setForceExport(false);
  };

  const onConfirmDialog = () => {
    if (forceExport && pendingMode) {
      const mode = pendingMode;
      closeDialog();
      void runExport(mode);
    } else {
      // jump to first invalid
      const first = validationIssues[0];
      if (first) setActive(first.slideId);
      closeDialog();
    }
  };

  const dialogOpen = pendingMode !== null && validationIssues.length > 0;
  const isBusy = exporting !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={isBusy || slides.length === 0}>
            {isBusy ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1 h-4 w-4" />
            )}
            {exporting === "single" ? "Export PNG..." : exporting === "zip" ? "Export ZIP..." : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            disabled={!activeSlideId}
            onClick={() => handleClick("single")}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">PNG — slide corrente</span>
              <span className="text-xs text-muted-foreground">
                {activeSlideId ? `Slide ${(activeIndex + 1).toString().padStart(2, "0")}` : "Nessuna slide attiva"}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={slides.length === 0}
            onClick={() => handleClick("zip")}
          >
            <Package className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">ZIP — tutte le slide</span>
              <span className="text-xs text-muted-foreground">{slides.length} slide</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Campi obbligatori mancanti
            </AlertDialogTitle>
            <AlertDialogDescription>
              {validationIssues.length} slide{validationIssues.length === 1 ? "" : ""} con campi non compilati.
              Completa i campi prima di esportare, oppure forza l'export per generare comunque le PNG.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 space-y-2 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
            {validationIssues.map((issue) => (
              <div key={issue.slideId}>
                <div className="font-medium">
                  Slide {(issue.slideIndex + 1).toString().padStart(2, "0")} · {issue.templateLabel}
                </div>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">
                  {issue.errors.map((e, i) => (
                    <li key={i}>{e.message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={forceExport} onCheckedChange={(c) => setForceExport(!!c)} />
            <span>Esporta comunque (ignora validazione)</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDialog}>
              {forceExport ? "Esporta comunque" : "Vai alla prima slide invalida"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
