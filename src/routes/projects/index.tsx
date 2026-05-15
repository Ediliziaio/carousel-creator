import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, FolderKanban, Trash2, Check, Search } from "lucide-react";
import {
  listProjects,
  createProject,
  deleteProject,
  getAllProjectsStats,
  type ProjectRow,
  type ProjectStats,
} from "@/lib/projectsApi";
import { STATUS_META } from "@/lib/contentsApi";
import { UserMenu } from "@/components/UserMenu";
import { useCarousel } from "@/lib/store";
import { applyThemeToBrand } from "@/lib/presets";
import { DEFAULT_BRAND } from "@/lib/templates";

const DEFAULT_PROJECT_BRAND_KEY = "default-project-brand-id";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [stats, setStats] = useState<Map<string, ProjectStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchProj, setSearchProj] = useState("");
  const [searchContents, setSearchContents] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const brandPresets = useCarousel((s) => s.brandPresets);
  // ID del brand preset di default per nuovi progetti, salvato in localStorage.
  // null = "Default base" (DEFAULT_BRAND), nessun preset.
  const [defaultBrandId, setDefaultBrandId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(DEFAULT_PROJECT_BRAND_KEY);
  });
  // Brand selezionato per il progetto in creazione (default = quello salvato).
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(defaultBrandId);

  useEffect(() => {
    void refresh();
  }, []);

  // Quando il dialog viene riaperto, riparti dal default brand persistito.
  useEffect(() => {
    if (open) setSelectedBrandId(defaultBrandId);
  }, [open, defaultBrandId]);

  async function refresh() {
    setLoading(true);
    try {
      const [rows, statsMap] = await Promise.all([listProjects(), getAllProjectsStats()]);
      setProjects(rows);
      setStats(statsMap);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Risultati ricerca: progetti filtrati + match nei contenuti.
  const filteredProjects = useMemo(() => {
    const term = searchProj.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term),
    );
  }, [projects, searchProj]);

  const contentMatches = useMemo(() => {
    const term = searchContents.trim().toLowerCase();
    if (!term || term.length < 2) return [];
    const out: { projectId: string; projectName: string; contentId: string; contentName: string; type: string }[] = [];
    for (const [projectId, ps] of stats.entries()) {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) continue;
      for (const r of ps.recent) {
        if (r.name.toLowerCase().includes(term)) {
          out.push({
            projectId,
            projectName: proj.name,
            contentId: r.id,
            contentName: r.name,
            type: r.type,
          });
          if (out.length >= 20) return out;
        }
      }
    }
    return out;
  }, [searchContents, stats, projects]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      // Brand iniziale: applica la palette del preset selezionato sopra DEFAULT_BRAND.
      const preset = selectedBrandId
        ? brandPresets.find((p) => p.id === selectedBrandId)
        : null;
      const brand = preset ? applyThemeToBrand(DEFAULT_BRAND, preset.theme) : null;
      const p = await createProject({
        name: name.trim(),
        description: description.trim() || null,
        brand,
      });
      toast.success("Progetto creato");
      setOpen(false);
      setName("");
      setDescription("");
      void navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function setAsDefaultBrand(id: string | null) {
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(DEFAULT_PROJECT_BRAND_KEY, id);
      else localStorage.removeItem(DEFAULT_PROJECT_BRAND_KEY);
    }
    setDefaultBrandId(id);
    toast.success(
      id
        ? `"${brandPresets.find((p) => p.id === id)?.name ?? "Brand"}" è ora il default`
        : "Default reimpostato",
    );
  }

  async function performDelete(id: string) {
    try {
      await deleteProject(id);
      toast.success("Progetto eliminato");
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">I miei progetti</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Ogni progetto raccoglie i tuoi post, caroselli e storie con il proprio brand.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuovo progetto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={onCreate}>
                <DialogHeader>
                  <DialogTitle>Crea un nuovo progetto</DialogTitle>
                  <DialogDescription>
                    Dai un nome al progetto. Potrai personalizzare brand e contenuti dopo.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome progetto *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Es. AEDIX – Studio Architettura"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione (opzionale)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Cliente, target, note..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Brand di partenza</Label>
                      {selectedBrandId !== defaultBrandId && (
                        <button
                          type="button"
                          onClick={() => setAsDefaultBrand(selectedBrandId)}
                          className="text-[10px] text-primary underline"
                        >
                          Imposta come default
                        </button>
                      )}
                    </div>
                    <div className="grid max-h-[200px] grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBrandId(null)}
                        className={`flex items-center gap-2 rounded-md border p-2 text-left transition hover:bg-muted ${
                          selectedBrandId === null
                            ? "border-primary ring-1 ring-primary"
                            : "border-border"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">Default base</div>
                          {defaultBrandId === null && (
                            <div className="text-[9px] text-primary">⭐ default</div>
                          )}
                        </div>
                        {selectedBrandId === null && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                      {brandPresets.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedBrandId(p.id)}
                          className={`flex items-center gap-2 rounded-md border p-2 text-left transition hover:bg-muted ${
                            selectedBrandId === p.id
                              ? "border-primary ring-1 ring-primary"
                              : "border-border"
                          }`}
                        >
                          <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border">
                            <span style={{ background: p.theme.bgColor }} className="flex-1" />
                            <span style={{ background: p.theme.accent }} className="flex-1" />
                            <span
                              style={{ background: p.theme.accentSecondary }}
                              className="flex-1"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">{p.name}</div>
                            {defaultBrandId === p.id && (
                              <div className="text-[9px] text-primary">⭐ default</div>
                            )}
                          </div>
                          {selectedBrandId === p.id && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Potrai modificare il brand in qualsiasi momento dalle impostazioni del
                      progetto.
                    </p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={creating}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={creating || !name.trim()}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crea progetto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search bar: progetto + contenuti */}
        {!loading && projects.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchProj}
                onChange={(e) => setSearchProj(e.target.value)}
                placeholder="Cerca tra i progetti…"
                className="pl-8"
              />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchContents}
                onChange={(e) => setSearchContents(e.target.value)}
                placeholder="Cerca tra TUTTI i contenuti (cross-progetto)…"
                className="pl-8"
              />
            </div>
          </div>
        )}

        {/* Risultati ricerca contenuti cross-progetto */}
        {!loading && contentMatches.length > 0 && (
          <Card className="mb-4 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              🔍 Trovati {contentMatches.length} contenuti
            </div>
            <ul className="space-y-1">
              {contentMatches.map((m) => (
                <li key={m.contentId}>
                  <Link
                    to="/projects/$projectId/builder/$contentId"
                    params={{ projectId: m.projectId, contentId: m.contentId }}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
                      {m.type}
                    </span>
                    <span className="flex-1 truncate font-medium">{m.contentName}</span>
                    <span className="text-xs text-muted-foreground">{m.projectName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Caricamento progetti…
          </div>
        ) : projects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Nessun progetto ancora</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea il primo progetto per iniziare a generare contenuti.
              </p>
            </div>
            <Button onClick={() => setOpen(true)} className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Crea il primo progetto
            </Button>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Nessun progetto trovato</p>
            <p className="text-xs text-muted-foreground">Prova a cambiare i termini di ricerca.</p>
            <Button variant="outline" size="sm" onClick={() => setSearchProj("")} className="mt-1">
              Reset filtro
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const ps = stats.get(p.id);
              const total = ps?.total ?? 0;
              const published = ps?.byStatus["published"] ?? 0;
              const inProgress = ps?.byStatus["in_progress"] ?? 0;
              const review = ps?.byStatus["review"] ?? 0;
              const today = ps?.scheduledToday ?? 0;
              const week = ps?.scheduledThisWeek ?? 0;
              return (
              <Card key={p.id} className="group relative overflow-hidden p-5 transition hover:shadow-md">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="block"
                >
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}

                  {/* Stats riassunto */}
                  {total > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                      <div className="rounded-md bg-muted/50 py-1.5">
                        <div className="text-lg font-bold tabular-nums">{total}</div>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          Totali
                        </div>
                      </div>
                      <div className="rounded-md bg-amber-500/10 py-1.5">
                        <div className="text-lg font-bold tabular-nums text-amber-700">
                          {inProgress + review}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-amber-700/80">
                          In lavoro
                        </div>
                      </div>
                      <div className="rounded-md bg-green-500/10 py-1.5">
                        <div className="text-lg font-bold tabular-nums text-green-700">
                          {published}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-green-700/80">
                          Pubblicati
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Nessun contenuto ancora.
                    </p>
                  )}

                  {/* Badge calendario */}
                  {(today > 0 || week > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {today > 0 && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-semibold text-blue-700">
                          📅 {today} oggi
                        </span>
                      )}
                      {week > 0 && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-700/80">
                          {week} questa settimana
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recent contents */}
                  {ps && ps.recent.length > 0 && (
                    <div className="mt-3 border-t border-border pt-2">
                      <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                        Recenti
                      </div>
                      <ul className="space-y-0.5">
                        {ps.recent.map((r) => (
                          <li
                            key={r.id}
                            className="truncate text-xs text-muted-foreground"
                            title={r.name}
                          >
                            · {r.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-3 text-[10px] text-muted-foreground">
                    Aggiornato il{" "}
                    {new Date(p.updated_at).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingDelete(p);
                  }}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  title="Elimina progetto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il progetto?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete &&
                `Verranno eliminati definitivamente "${pendingDelete.name}" e tutti i contenuti (post, caroselli, storie) collegati.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) void performDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
