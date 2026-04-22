import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCarousel } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { listCarousels, saveCarousel, deleteCarousel, type CarouselRow } from "@/lib/carouselsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User2, Save, FolderOpen, LogOut, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function UserMenu() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const brand = useCarousel((s) => s.brand);
  const slides = useCarousel((s) => s.slides);
  const loadJSON = useCarousel((s) => s.loadJSON);

  const [saveOpen, setSaveOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<CarouselRow[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (!listOpen) return;
    setListLoading(true);
    listCarousels()
      .then(setItems)
      .catch((e) => toast.error("Impossibile caricare: " + (e as Error).message))
      .finally(() => setListLoading(false));
  }, [listOpen]);

  async function handleSave() {
    const name = saveName.trim() || brand.carouselTitle || "Carosello senza titolo";
    setSaving(true);
    try {
      await saveCarousel({ name, data: { brand, slides } });
      toast.success("Carosello salvato");
      setSaveOpen(false);
      setSaveName("");
    } catch (e) {
      toast.error("Errore nel salvataggio: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleLoad(row: CarouselRow) {
    try {
      const parsed = row.data as { brand?: unknown; slides?: unknown[] };
      if (!parsed?.brand || !Array.isArray(parsed.slides)) {
        throw new Error("Formato dati non valido");
      }
      loadJSON(parsed as Parameters<typeof loadJSON>[0]);
      toast.success(`"${row.name}" caricato`);
      setListOpen(false);
    } catch (e) {
      toast.error("Errore nel caricamento: " + (e as Error).message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminare "${name}"? L'operazione non è reversibile.`)) return;
    try {
      await deleteCarousel(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Carosello eliminato");
    } catch (e) {
      toast.error("Errore: " + (e as Error).message);
    }
  }

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login" });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" title={user?.email ?? "Account"}>
            <User2 className="mr-1 h-4 w-4" />
            <span className="max-w-[140px] truncate">{user?.email ?? "Account"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setSaveName(brand.carouselTitle ?? "");
              setSaveOpen(true);
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Salva carosello
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setListOpen(true)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            I miei caroselli
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salva carosello</DialogTitle>
            <DialogDescription>
              Il carosello corrente verrà salvato sul tuo account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="save-name">Nome</Label>
            <Input
              id="save-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Es. Offerta primavera 2026"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>I miei caroselli</DialogTitle>
            <DialogDescription>
              Clicca un carosello per caricarlo nell'editor.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {listLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Caricamento…
              </div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Non hai ancora salvato nessun carosello.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => handleLoad(row)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-foreground">{row.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Aggiornato {new Date(row.updated_at).toLocaleString()}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(row.id, row.name)}
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
