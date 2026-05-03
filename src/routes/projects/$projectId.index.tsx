import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  ImageIcon,
  Images,
  Loader2,
  Plus,
  Smartphone,
  Trash2,
  Copy,
  Wand2,
  Kanban,
  List,
} from "lucide-react";
import { getProject, type ProjectRow } from "@/lib/projectsApi";
import {
  listContents,
  deleteContent,
  saveContent,
  duplicateContent,
  updateContentStatus,
  bulkCreateBacklog,
  getContentStatus,
  STATUS_META,
  STATUS_ORDER,
  type ContentRow,
  type ContentType,
  type ContentStatus,
} from "@/lib/contentsApi";
import { UserMenu } from "@/components/UserMenu";
import { makeDefaultSlide, type SlideFormat } from "@/lib/templates";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectDashboard,
});

interface TypeMeta {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultName: string;
}

const TYPE_META: Record<ContentType, TypeMeta> = {
  post: {
    label: "Post",
    description: "Immagini singole 1:1 o 4:5 per il feed.",
    icon: ImageIcon,
    defaultName: "Nuovo post",
  },
  carousel: {
    label: "Caroselli",
    description: "Sequenze multi-slide editoriali.",
    icon: Images,
    defaultName: "Nuovo carosello",
  },
  story: {
    label: "Storie",
    description: "Verticali 9:16 per Instagram/Facebook stories.",
    icon: Smartphone,
    defaultName: "Nuova storia",
  },
};

const VIEW_KEY = "project-dashboard-view";
type ViewMode = "kanban" | "list";

function ProjectDashboard() {
  const { projectId } = useParams({ from: "/projects/$projectId/" });
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContentType>("carousel");
  const [pendingDelete, setPendingDelete] = useState<ContentRow | null>(null);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "kanban";
    return (localStorage.getItem(VIEW_KEY) as ViewMode) || "kanban";
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    void load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([getProject(projectId), listContents(projectId)]);
      if (!p) {
        toast.error("Progetto non trovato");
        void navigate({ to: "/projects" });
        return;
      }
      setProject(p);
      setItems(c);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Filtra per type attivo (tab) — il Kanban ha 5 colonne SOLO del type selezionato.
  const itemsByTab = useMemo(() => items.filter((i) => i.type === tab), [items, tab]);
  const grouped = useMemo(() => {
    return {
      post: items.filter((i) => i.type === "post"),
      carousel: items.filter((i) => i.type === "carousel"),
      story: items.filter((i) => i.type === "story"),
    };
  }, [items]);

  async function onCreate(type: ContentType) {
    try {
      const defaultFormat: SlideFormat =
        type === "story" ? "story" : type === "post" ? "square" : "portrait";
      const initialSlides =
        type === "carousel" ? [] : [makeDefaultSlide("cover", defaultFormat)];
      const row = await saveContent({
        projectId,
        type,
        name: TYPE_META[type].defaultName,
        data: {
          brand: project?.brand ?? null,
          slides: initialSlides,
          activeLang: "it",
          contentType: type,
          defaultFormat,
          status: "in_progress",
        },
      });
      void navigate({
        to: "/projects/$projectId/builder/$contentId",
        params: { projectId, contentId: row.id },
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDuplicate(id: string) {
    try {
      const dup = await duplicateContent(id);
      setItems((p) => [dup, ...p]);
      toast.success("Contenuto duplicato");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onStatusChange(id: string, newStatus: ContentStatus) {
    // Optimistic update
    setItems((p) =>
      p.map((c) =>
        c.id === id
          ? {
              ...c,
              data: {
                ...((c.data && typeof c.data === "object"
                  ? c.data
                  : {}) as Record<string, unknown>),
                status: newStatus,
              } as unknown,
            }
          : c,
      ),
    );
    try {
      await updateContentStatus(id, newStatus);
      toast.success(`Spostato in: ${STATUS_META[newStatus].label}`);
    } catch (e) {
      toast.error((e as Error).message);
      // Rollback: rifetch
      void load();
    }
  }

  async function performDeleteContent(id: string) {
    try {
      await deleteContent(id);
      setItems((p) => p.filter((x) => x.id !== id));
      toast.success("Contenuto eliminato");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/projects" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground">
                {project?.name ?? "…"}
              </h1>
              {project?.description && (
                <p className="truncate text-xs text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Caricamento…
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as ContentType)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                {(Object.keys(TYPE_META) as ContentType[]).map((t) => {
                  const Icon = TYPE_META[t].icon;
                  return (
                    <TabsTrigger key={t} value={t} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {TYPE_META[t].label}
                      <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
                        {grouped[t].length}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                  <button
                    onClick={() => setView("kanban")}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                      view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <Kanban className="h-3.5 w-3.5" /> Kanban
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                      view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" /> Griglia
                  </button>
                </div>
                <BulkCreateDialog
                  projectId={projectId}
                  type={tab}
                  onCreated={(rows) => setItems((p) => [...rows, ...p])}
                />
                <Button onClick={() => void onCreate(tab)} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Nuovo {TYPE_META[tab].label.toLowerCase()}
                </Button>
              </div>
            </div>

            {(Object.keys(TYPE_META) as ContentType[]).map((t) => (
              <TabsContent key={t} value={t} className="mt-4">
                {view === "kanban" ? (
                  <KanbanBoard
                    items={t === tab ? itemsByTab : grouped[t]}
                    projectId={projectId}
                    onStatusChange={onStatusChange}
                    onDuplicate={onDuplicate}
                    onDelete={(c) => setPendingDelete(c)}
                  />
                ) : (
                  <GridView
                    items={t === tab ? itemsByTab : grouped[t]}
                    projectId={projectId}
                    typeMeta={TYPE_META[t]}
                    onCreate={() => void onCreate(t)}
                    onDuplicate={onDuplicate}
                    onDelete={(c) => setPendingDelete(c)}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il contenuto?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete &&
                `Stai per eliminare "${pendingDelete.name}". L'operazione non è reversibile.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) void performDeleteContent(pendingDelete.id);
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

/* ===================== KanbanBoard ===================== */
function KanbanBoard({
  items,
  projectId,
  onStatusChange,
  onDuplicate,
  onDelete,
}: {
  items: ContentRow[];
  projectId: string;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onDuplicate: (id: string) => void;
  onDelete: (c: ContentRow) => void;
}) {
  const grouped = useMemo(() => {
    const out: Record<ContentStatus, ContentRow[]> = {
      backlog: [],
      in_progress: [],
      review: [],
      scheduled: [],
      published: [],
    };
    items.forEach((c) => {
      const s = getContentStatus(c);
      out[s].push(c);
    });
    return out;
  }, [items]);

  const onDrop = (e: React.DragEvent, target: ContentStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onStatusChange(id, target);
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {STATUS_ORDER.map((status) => {
        const meta = STATUS_META[status];
        const list = grouped[status];
        return (
          <div
            key={status}
            className={`rounded-lg border-2 ${meta.bg} p-3`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, status)}
          >
            <div className={`mb-3 flex items-center gap-1.5 text-xs font-bold ${meta.color}`}>
              <span>{meta.emoji}</span>
              <span className="uppercase tracking-wider">{meta.label}</span>
              <span className="ml-auto rounded-full bg-background/80 px-1.5 py-0.5 text-[10px]">
                {list.length}
              </span>
            </div>
            <div className="space-y-2">
              {list.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 py-6 text-center text-[11px] text-muted-foreground">
                  Trascina qui
                </div>
              ) : (
                list.map((c) => (
                  <KanbanCard
                    key={c.id}
                    content={c}
                    projectId={projectId}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  content,
  projectId,
  onDuplicate,
  onDelete,
  onStatusChange,
}: {
  content: ContentRow;
  projectId: string;
  onDuplicate: (id: string) => void;
  onDelete: (c: ContentRow) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
}) {
  const status = getContentStatus(content);
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", content.id)}
      className="group relative cursor-move rounded-md border border-border bg-card p-2.5 shadow-sm transition hover:shadow-md"
    >
      <Link
        to="/projects/$projectId/builder/$contentId"
        params={{ projectId, contentId: content.id }}
        className="block"
      >
        {content.thumbnail ? (
          <div className="mb-2 aspect-[4/5] w-full overflow-hidden rounded-sm bg-muted">
            <img
              src={content.thumbnail}
              alt={content.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="text-xs font-medium leading-tight text-foreground line-clamp-2">
          {content.name}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {new Date(content.updated_at).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "short",
          })}
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-1">
        <Select value={status} onValueChange={(v) => onStatusChange(content.id, v as ContentStatus)}>
          <SelectTrigger className="h-6 w-full px-1.5 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {STATUS_META[s].emoji} {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDuplicate(content.id);
          }}
          className="rounded bg-card/90 p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          title="Duplica"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(content);
          }}
          className="rounded bg-card/90 p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Elimina"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ===================== GridView (vista classica) ===================== */
function GridView({
  items,
  projectId,
  typeMeta,
  onCreate,
  onDuplicate,
  onDelete,
}: {
  items: ContentRow[];
  projectId: string;
  typeMeta: TypeMeta;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (c: ContentRow) => void;
}) {
  const Icon = typeMeta.icon;
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Nessun {typeMeta.label.toLowerCase()}</p>
        <p className="text-sm text-muted-foreground">Crea il primo per iniziare.</p>
        <Button onClick={onCreate} className="mt-2">
          <Plus className="mr-2 h-4 w-4" />
          Crea
        </Button>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => {
        const status = getContentStatus(c);
        const meta = STATUS_META[status];
        return (
          <Card key={c.id} className="group relative overflow-hidden p-3 transition hover:shadow-md">
            <Link
              to="/projects/$projectId/builder/$contentId"
              params={{ projectId, contentId: c.id }}
              className="block"
            >
              <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                {c.thumbnail ? (
                  <img
                    src={c.thumbnail}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-start gap-2">
                <h3 className="flex-1 truncate font-medium text-foreground">{c.name}</h3>
                <span
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${meta.bg} ${meta.color}`}
                  title={meta.label}
                >
                  {meta.emoji} {meta.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(c.updated_at).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </Link>
            <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDuplicate(c.id);
                }}
                className="rounded-md bg-card/80 p-1.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                title="Duplica"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(c);
                }}
                className="rounded-md bg-card/80 p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Elimina"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ===================== BulkCreateDialog ===================== */
function BulkCreateDialog({
  projectId,
  type,
  onCreated,
}: {
  projectId: string;
  type: ContentType;
  onCreated: (rows: ContentRow[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setCreating(true);
    try {
      const rows = await bulkCreateBacklog(projectId, type, lines);
      onCreated(rows);
      toast.success(`${rows.length} ${TYPE_META[type].label.toLowerCase()} creati in "Da creare"`);
      setOpen(false);
      setText("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wand2 className="mr-1 h-4 w-4" /> Aggiungi N idee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi più contenuti in 1 colpo</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Una riga = un contenuto. Vengono creati in stato{" "}
            <strong>💡 Da creare</strong>, vuoti. Poi li lavorerai uno a uno.
            Tipo: <strong>{TYPE_META[type].label.toLowerCase()}</strong>.
          </p>
          <Label htmlFor="bulk-text">Idee / titoli (uno per riga)</Label>
          <Textarea
            id="bulk-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={
              "5 errori nei preventivi edili\nCome pianificare un cantiere senza ritardi\nCalcolo dei margini: il metodo FIFO\nFatturazione SDI: la guida 2026\n+800 imprese in 12 mesi"
            }
            className="font-mono text-sm"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{lines.length} righe valide</span>
            <Button type="submit" disabled={creating || lines.length === 0}>
              {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Crea {lines.length} {TYPE_META[type].label.toLowerCase()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
