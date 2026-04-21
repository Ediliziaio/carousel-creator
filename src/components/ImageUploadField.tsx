import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  hint?: string;
  /** Max size in MB. Default 5. */
  maxMB?: number;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function ImageUploadField({ label, value, onChange, hint, maxMB = 5 }: Props) {
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

  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative rounded-md border border-border overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="block max-h-48 w-full object-contain" />
          <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Immagine caricata
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
              <X className="h-3.5 w-3.5 mr-1" /> Rimuovi
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
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
