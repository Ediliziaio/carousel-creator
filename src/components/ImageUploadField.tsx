import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  hint?: string;
  /** Max size in MB. Default 5. */
  maxMB?: number;
  /** "default" rectangular preview, "avatar" circular 96x96 preview. */
  variant?: "default" | "avatar";
}

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function ImageUploadField({ label, value, onChange, hint, maxMB = 5, variant = "default" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const readFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato non supportato. Usa PNG, JPG o WEBP.");
      return;
    }
    const max = maxMB * 1024 * 1024;
    if (file.size > max) {
      toast.error(`File troppo grande (max ${maxMB}MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.onerror = () => toast.error("Impossibile leggere il file.");
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  const renderPreview = () => {
    if (variant === "avatar") {
      return (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted/30">
            <img src={value} alt={label} className="h-full w-full object-cover" />
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button type="button" size="sm" variant="outline" onClick={openPicker}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Sostituisci
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
              <X className="mr-1 h-3.5 w-3.5" /> Rimuovi
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="relative overflow-hidden rounded-md border border-border bg-muted/30">
        <img src={value} alt={label} className="block max-h-48 w-full object-contain" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="h-3 w-3" /> Immagine caricata
          </span>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="outline" onClick={openPicker}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Sostituisci
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
              <X className="mr-1 h-3.5 w-3.5" /> Rimuovi
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>}
      {value ? (
        renderPreview()
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={openPicker}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"}`}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            Trascina qui un'immagine o <span className="font-medium text-foreground">clicca per scegliere</span>
          </div>
          <div className="text-[10px] text-muted-foreground">PNG / JPG / WEBP — max {maxMB}MB</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
          e.target.value = "";
        }}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
