import { useRef, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Video, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateVideoAndWait, type VideoModel } from "@/lib/videoApi";

interface Props {
  /** Trigger custom (es. Button "Genera video"). */
  trigger: React.ReactNode;
  /** Chiamato con l'URL del video generato (Fal.ai cdn). */
  onGenerated: (videoUrl: string) => void;
  /** Pre-fill prompt da slide title o altro. */
  initialPrompt?: string;
}

const MODELS: { id: VideoModel; label: string; price: string; speed: string }[] = [
  { id: "wan-fast", label: "Wan 2.1 Turbo", price: "~$0.04/sec", speed: "~30 sec" },
  { id: "kling", label: "Kling 2.1", price: "~$0.05/sec", speed: "~2 min" },
  { id: "luma", label: "Luma Dream Machine", price: "~$0.06/sec", speed: "~1 min" },
  { id: "veo3", label: "Veo 3", price: "~$0.20/sec", speed: "~3 min" },
];

export function VideoGenerateDialog({ trigger, onGenerated, initialPrompt = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState<VideoModel>("wan-fast");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    setProgress("Invio in coda…");
    abortRef.current = new AbortController();
    try {
      const url = await generateVideoAndWait(
        { prompt, model, duration, aspectRatio },
        (msg) => setProgress(msg),
        abortRef.current.signal,
      );
      onGenerated(url);
      toast.success("Video generato");
      setOpen(false);
      setPrompt("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
      setProgress("");
      abortRef.current = null;
    }
  }

  function cancelGeneration() {
    abortRef.current?.abort();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && generating) return; // non si chiude mentre genera
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-4 w-4" /> Genera video AI
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="vg-prompt">Prompt</Label>
            <Textarea
              id="vg-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Es. Cantiere edile al tramonto, gru in movimento, drone shot lento, cinematico"
              autoFocus
              disabled={generating}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 space-y-1.5 sm:col-span-2">
              <Label>Modello</Label>
              <Select
                value={model}
                onValueChange={(v) => setModel(v as VideoModel)}
                disabled={generating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-medium">{m.label}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        {m.price} · {m.speed}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durata</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
                disabled={generating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 8, 10].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} sec
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Formato</Label>
            <div className="flex gap-1.5">
              {(["9:16", "1:1", "16:9"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAspectRatio(r)}
                  disabled={generating}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs transition ${
                    aspectRatio === r
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {r === "9:16" ? "📱 Story 9:16" : r === "1:1" ? "🟦 Square 1:1" : "🖥 Wide 16:9"}
                </button>
              ))}
            </div>
          </div>

          {generating && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {progress || "Generazione in corso…"}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Tempo medio 30 sec – 3 minuti a seconda del modello. NON chiudere questa
                finestra.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            {generating ? (
              <Button type="button" variant="outline" onClick={cancelGeneration}>
                Annulla
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Chiudi
              </Button>
            )}
            <Button type="submit" disabled={generating || !prompt.trim()}>
              {generating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> In corso
                </>
              ) : (
                <>
                  <Wand2 className="mr-1 h-4 w-4" /> Genera
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
