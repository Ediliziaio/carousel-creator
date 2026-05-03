import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
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
import { Loader2, Plus, FolderKanban, Trash2 } from "lucide-react";
import { listProjects, createProject, deleteProject, type ProjectRow } from "@/lib/projectsApi";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listProjects();
      setProjects(rows);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const p = await createProject({
        name: name.trim(),
        description: description.trim() || null,
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
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
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
                  <p className="mt-3 text-xs text-muted-foreground">
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
            ))}
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
