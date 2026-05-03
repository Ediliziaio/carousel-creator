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
import { Search, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  searchPhotos,
  photoToDataUrl,
  isPhotoSearchConfigured,
  type PhotoResult,
} from "@/lib/photoSearch";

interface Props {
  /** Trigger custom (es. Button "Cerca foto"). */
  trigger: React.ReactNode;
  /** Chiamato quando l'utente sceglie una foto: riceve dataURL dell'immagine. */
  onPick: (dataUrl: string, photo: PhotoResult) => void;
}

export function PhotoSearchDialog({ trigger, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PhotoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const configured = isPhotoSearchConfigured();

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await searchPhotos(query);
      setResults(r);
      if (r.length === 0) toast.info("Nessun risultato. Prova con altri termini.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function pick(photo: PhotoResult) {
    setPicking(photo.id);
    try {
      const dataUrl = await photoToDataUrl(photo);
      onPick(dataUrl, photo);
      toast.success(`Foto di ${photo.author} aggiunta`);
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPicking(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Cerca foto stock (gratuite)</DialogTitle>
        </DialogHeader>
        {!configured ? (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
            <div className="font-medium text-yellow-700 dark:text-yellow-500">
              ⚠️ API foto non configurata
            </div>
            <p className="mt-1 text-yellow-700/80 dark:text-yellow-400/80">
              Aggiungi una di queste env var su Cloudflare Pages → Settings → Environment
              variables (Plain text), poi ridistribuisci:
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 font-mono text-xs">
              <li>
                <strong>VITE_UNSPLASH_ACCESS_KEY</strong> — registrati gratis su{" "}
                <a
                  href="https://unsplash.com/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  unsplash.com/developers
                </a>{" "}
                (50 req/h)
              </li>
              <li>
                <strong>VITE_PEXELS_API_KEY</strong> — registrati gratis su{" "}
                <a
                  href="https://www.pexels.com/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  pexels.com/api
                </a>{" "}
                (200 req/h)
              </li>
            </ul>
          </div>
        ) : (
          <>
            <form onSubmit={onSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Es. ufficio architettura, ristrutturazione, parquet..."
                autoFocus
              />
              <Button type="submit" disabled={searching || !query.trim()}>
                {searching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Cerca
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Risultati ottimizzati verticali (4:5 e 9:16). Le foto sono gratuite per uso
              commerciale (licenza Unsplash / Pexels).
            </p>
            {results.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-4">
                {results.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => void pick(photo)}
                    disabled={!!picking}
                    className="group relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-muted transition hover:border-primary"
                  >
                    <img
                      src={photo.thumbUrl}
                      alt={`Foto di ${photo.author}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {picking === photo.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                      {photo.author}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!searching && results.length === 0 && query && (
              <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p className="text-sm">Premi "Cerca" per vedere i risultati.</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
