import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Search,
  ChevronDown,
} from "lucide-react";
import { getProject, type ProjectRow } from "@/lib/projectsApi";
import {
  listContents,
  deleteContent,
  saveContent,
  duplicateContent,
  updateContentStatus,
  updateContentSchedule,
  bulkCreateBacklog,
  bulkCreateFromBriefs,
  getContentStatus,
  getContentScheduledAt,
  formatScheduleLabel,
  STATUS_META,
  STATUS_ORDER,
  type ContentRow,
  type ContentType,
  type ContentStatus,
} from "@/lib/contentsApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { Input } from "@/components/ui/input";
import { makeDefaultSlide, type SlideFormat } from "@/lib/templates";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectDashboard,
});

interface TypeMeta {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultName: string;
  emoji: string;
}

const TYPE_META: Record<ContentType, TypeMeta> = {
  post: {
    label: "Post",
    description: "Immagine singola 1:1 o 4:5",
    icon: ImageIcon,
    defaultName: "Nuovo post",
    emoji: "📷",
  },
  carousel: {
    label: "Carosello",
    description: "Sequenze multi-slide",
    icon: Images,
    defaultName: "Nuovo carosello",
    emoji: "📑",
  },
  story: {
    label: "Storia",
    description: "Verticale 9:16",
    icon: Smartphone,
    defaultName: "Nuova storia",
    emoji: "📱",
  },
};

const VIEW_KEY = "project-dashboard-view-v2";
type ViewMode = "kanban" | "list";

function ProjectDashboard() {
  const { projectId } = useParams({ from: "/projects/$projectId/" });
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<ContentRow | null>(null);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "kanban";
    return (localStorage.getItem(VIEW_KEY) as ViewMode) || "kanban";
  });
  // Filtri attivi: tipi inclusi (default: tutti). Set di ContentType.
  const [activeTypes, setActiveTypes] = useState<Set<ContentType>>(
    new Set(["post", "carousel", "story"]),
  );
  const [search, setSearch] = useState("");

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

  // Filter applicato a TUTTI i contenuti (no tabs).
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((c) => {
      if (!activeTypes.has(c.type)) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, activeTypes, search]);

  // Stats per stato (su tutti i contenuti del progetto, non filtrati).
  const statsByStatus = useMemo(() => {
    const out: Record<ContentStatus, number> = {
      backlog: 0,
      in_progress: 0,
      review: 0,
      scheduled: 0,
      published: 0,
    };
    items.forEach((c) => {
      out[getContentStatus(c)]++;
    });
    return out;
  }, [items]);

  const countsByType = useMemo(() => {
    return {
      post: items.filter((i) => i.type === "post").length,
      carousel: items.filter((i) => i.type === "carousel").length,
      story: items.filter((i) => i.type === "story").length,
    };
  }, [items]);

  const toggleType = (t: ContentType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      // Se rimasto vuoto, riattiva tutti (UX safety).
      if (next.size === 0) return new Set(["post", "carousel", "story"]);
      return next;
    });
  };

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
      toast.success(`→ ${STATUS_META[newStatus].label}`);
    } catch (e) {
      toast.error((e as Error).message);
      void load();
    }
  }

  async function onScheduleChange(id: string, scheduledAt: string | null) {
    // Optimistic update
    setItems((p) =>
      p.map((c) => {
        if (c.id !== id) return c;
        const data = (c.data && typeof c.data === "object" ? { ...c.data } : {}) as Record<
          string,
          unknown
        >;
        if (scheduledAt) {
          data.scheduledAt = scheduledAt;
          if (data.status !== "published") data.status = "scheduled";
        } else {
          delete data.scheduledAt;
          if (data.status === "scheduled") data.status = "review";
        }
        return { ...c, data: data as unknown };
      }),
    );
    try {
      await updateContentSchedule(id, scheduledAt);
      toast.success(scheduledAt ? `📅 Pianificato` : "Data rimossa");
    } catch (e) {
      toast.error((e as Error).message);
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
          <>
            {/* === STATS RIASSUNTO === */}
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s];
                const n = statsByStatus[s];
                return (
                  <div
                    key={s}
                    className={`rounded-lg border p-3 ${meta.bg}`}
                    title={`${n} contenuti in ${meta.label}`}
                  >
                    <div className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>
                      {meta.emoji} {meta.label}
                    </div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{n}</div>
                  </div>
                );
              })}
            </div>

            {/* === TOOLBAR === */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* Filter chips type */}
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                {(["post", "carousel", "story"] as ContentType[]).map((t) => {
                  const active = activeTypes.has(t);
                  const Icon = TYPE_META[t].icon;
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      title={`Filtra ${TYPE_META[t].label.toLowerCase()}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{TYPE_META[t].label}</span>
                      <span
                        className={`rounded-full px-1.5 text-[10px] ${
                          active ? "bg-primary-foreground/20" : "bg-muted"
                        }`}
                      >
                        {countsByType[t]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca per nome…"
                  className="h-9 w-full pl-8 text-sm sm:w-[220px]"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                  <button
                    onClick={() => setView("kanban")}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                      view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    title="Vista Kanban"
                  >
                    <Kanban className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                      view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    title="Vista Griglia"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <BulkCreateDialog
                  projectId={projectId}
                  defaultType="carousel"
                  onCreated={(rows) => setItems((p) => [...rows, ...p])}
                />

                {/* Bottone unico "+ Nuovo" con dropdown scelta type */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Nuovo
                      <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px]">
                    {(["carousel", "post", "story"] as ContentType[]).map((t) => {
                      const meta = TYPE_META[t];
                      const Icon = meta.icon;
                      return (
                        <DropdownMenuItem
                          key={t}
                          onClick={() => void onCreate(t)}
                          className="cursor-pointer gap-2 py-2"
                        >
                          <Icon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{meta.label}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {meta.description}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* === BODY: KANBAN o GRID === */}
            {filtered.length === 0 ? (
              <EmptyState
                onCreate={onCreate}
                hasItems={items.length > 0}
                onResetFilters={() => {
                  setActiveTypes(new Set(["post", "carousel", "story"]));
                  setSearch("");
                }}
              />
            ) : view === "kanban" ? (
              <KanbanBoard
                items={filtered}
                projectId={projectId}
                onStatusChange={onStatusChange}
                onScheduleChange={onScheduleChange}
                onDuplicate={onDuplicate}
                onDelete={(c) => setPendingDelete(c)}
              />
            ) : (
              <GridView
                items={filtered}
                projectId={projectId}
                onScheduleChange={onScheduleChange}
                onDuplicate={onDuplicate}
                onDelete={(c) => setPendingDelete(c)}
              />
            )}
          </>
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

/* ===================== Empty state ===================== */
function EmptyState({
  onCreate,
  hasItems,
  onResetFilters,
}: {
  onCreate: (t: ContentType) => void;
  hasItems: boolean;
  onResetFilters: () => void;
}) {
  if (hasItems) {
    // Filtri attivi ma nessun risultato
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Search className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Nessun risultato</p>
        <p className="text-sm text-muted-foreground">Prova a rimuovere i filtri attivi.</p>
        <Button variant="outline" onClick={onResetFilters} className="mt-2">
          Reimposta filtri
        </Button>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex gap-2 text-3xl">📷 📑 📱</div>
      <div>
        <p className="text-base font-medium">Nessun contenuto in questo progetto</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea il primo o importa una lista da file/Claude.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {(["carousel", "post", "story"] as ContentType[]).map((t) => {
          const meta = TYPE_META[t];
          const Icon = meta.icon;
          return (
            <Button
              key={t}
              onClick={() => onCreate(t)}
              variant={t === "carousel" ? "default" : "outline"}
            >
              <Icon className="mr-1 h-4 w-4" /> {meta.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}

/* ===================== KanbanBoard ===================== */
function KanbanBoard({
  items,
  projectId,
  onStatusChange,
  onScheduleChange,
  onDuplicate,
  onDelete,
}: {
  items: ContentRow[];
  projectId: string;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onScheduleChange: (id: string, scheduledAt: string | null) => void;
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
      out[getContentStatus(c)].push(c);
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
                    onScheduleChange={onScheduleChange}
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
  onScheduleChange,
}: {
  content: ContentRow;
  projectId: string;
  onDuplicate: (id: string) => void;
  onDelete: (c: ContentRow) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onScheduleChange: (id: string, scheduledAt: string | null) => void;
}) {
  const status = getContentStatus(content);
  const typeMeta = TYPE_META[content.type];
  const TypeIcon = typeMeta.icon;
  const hasBrief = !!(content.data as { brief?: string })?.brief;
  const scheduledIso = getContentScheduledAt(content);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", content.id)}
      className="group relative cursor-move rounded-md border border-border bg-card p-2 shadow-sm transition hover:shadow-md"
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
        ) : (
          <div className="mb-2 flex aspect-[4/5] w-full items-center justify-center rounded-sm bg-muted/30">
            <TypeIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex items-start gap-1.5">
          <TypeIcon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <div className="text-xs font-medium leading-tight text-foreground line-clamp-2 flex-1">
            {content.name}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>
            {new Date(content.updated_at).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          {hasBrief && (
            <span className="ml-auto rounded bg-primary/15 px-1 text-[9px] font-semibold text-primary">
              📝 brief
            </span>
          )}
        </div>
      </Link>
      <div className="mt-1.5 flex items-center gap-1">
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(content.id, v as ContentStatus)}
        >
          <SelectTrigger className="h-6 flex-1 px-1.5 text-[10px]">
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
        <SchedulePopover
          contentId={content.id}
          scheduledIso={scheduledIso}
          onChange={onScheduleChange}
          compact
        />
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

/* Popover compatto per pianificare data senza aprire il builder. */
function SchedulePopover({
  contentId,
  scheduledIso,
  onChange,
  compact,
}: {
  contentId: string;
  scheduledIso: string | null;
  onChange: (id: string, iso: string | null) => void;
  compact?: boolean;
}) {
  const dateInput = scheduledIso
    ? new Date(scheduledIso).toISOString().split("T")[0]
    : "";
  const label = scheduledIso ? formatScheduleLabel(scheduledIso) : "";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`flex shrink-0 items-center gap-0.5 rounded border px-1.5 transition ${
            scheduledIso
              ? "border-blue-500/40 bg-blue-500/10 text-blue-700"
              : "border-border text-muted-foreground hover:bg-muted"
          } ${compact ? "h-6 text-[10px]" : "h-7 text-xs"}`}
          title={scheduledIso ? `Pianificato: ${label}` : "Pianifica data"}
        >
          <Calendar className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {scheduledIso && <span className="font-medium">{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 text-xs font-semibold">Data di pubblicazione</div>
        <Input
          type="date"
          defaultValue={dateInput}
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              const iso = new Date(v + "T09:00:00").toISOString();
              onChange(contentId, iso);
            } else {
              onChange(contentId, null);
            }
          }}
          className="h-9 text-sm"
        />
        <p className="mt-2 text-[10px] text-muted-foreground">
          Quando setti una data, il contenuto si sposta automaticamente in{" "}
          <strong>📅 Da pubblicare</strong>.
        </p>
        {scheduledIso && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(contentId, null)}
            className="mt-2 h-7 w-full text-xs"
          >
            Rimuovi data
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ===================== GridView ===================== */
function GridView({
  items,
  projectId,
  onScheduleChange,
  onDuplicate,
  onDelete,
}: {
  items: ContentRow[];
  projectId: string;
  onScheduleChange: (id: string, scheduledAt: string | null) => void;
  onDuplicate: (id: string) => void;
  onDelete: (c: ContentRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => {
        const status = getContentStatus(c);
        const meta = STATUS_META[status];
        const typeMeta = TYPE_META[c.type];
        const TypeIcon = typeMeta.icon;
        const hasBrief = !!(c.data as { brief?: string })?.brief;
        const scheduledIso = getContentScheduledAt(c);
        return (
          <Card key={c.id} className="group relative overflow-hidden p-3 transition hover:shadow-md">
            <Link
              to="/projects/$projectId/builder/$contentId"
              params={{ projectId, contentId: c.id }}
              className="block"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                {c.thumbnail ? (
                  <img
                    src={c.thumbnail}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <TypeIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-card/80 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
                  <TypeIcon className="h-3 w-3" />
                  {typeMeta.label}
                </span>
                {scheduledIso && (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                    <Calendar className="h-3 w-3" />
                    {formatScheduleLabel(scheduledIso)}
                  </span>
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
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {new Date(c.updated_at).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {hasBrief && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                    📝 brief
                  </span>
                )}
              </div>
            </Link>
            <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              <SchedulePopover
                contentId={c.id}
                scheduledIso={scheduledIso}
                onChange={onScheduleChange}
              />
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
  defaultType,
  onCreated,
}: {
  projectId: string;
  defaultType: ContentType;
  onCreated: (rows: ContentRow[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>(defaultType);
  const [mode, setMode] = useState<"titles" | "brief" | "file">("titles");
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);
  const [parsedBriefs, setParsedBriefs] = useState<{ name: string; brief: string }[]>([]);
  const [drag, setDrag] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  async function onTitlesSubmit(e: FormEvent) {
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

  async function onBriefSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setCreating(true);
    try {
      const { splitTextIntoBriefs } = await import("@/lib/bulkImport");
      const briefs = splitTextIntoBriefs(text);
      const rows = await bulkCreateFromBriefs(projectId, type, briefs);
      onCreated(rows);
      toast.success(`${rows.length} ${TYPE_META[type].label.toLowerCase()} creati con brief`);
      setOpen(false);
      setText("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    try {
      const { parseFileToBriefs } = await import("@/lib/bulkImport");
      const briefs = await parseFileToBriefs(file);
      if (briefs.length === 0) {
        toast.error("Nessun contenuto rilevato nel file");
        setParsedBriefs([]);
      } else {
        setParsedBriefs(briefs);
        toast.success(`${briefs.length} contenuti rilevati nel file`);
      }
    } catch (e) {
      toast.error((e as Error).message);
      setParsedBriefs([]);
    } finally {
      setParsing(false);
    }
  }

  async function onFileSubmit(e: FormEvent) {
    e.preventDefault();
    if (parsedBriefs.length === 0) return;
    setCreating(true);
    try {
      const rows = await bulkCreateFromBriefs(projectId, type, parsedBriefs);
      onCreated(rows);
      toast.success(`${rows.length} ${TYPE_META[type].label.toLowerCase()} importati da ${fileName}`);
      setOpen(false);
      setParsedBriefs([]);
      setFileName("");
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
          <Wand2 className="mr-1 h-4 w-4" /> Importa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importa contenuti in massa</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Crea come:</Label>
          <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["carousel", "post", "story"] as ContentType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {TYPE_META[t].emoji} {TYPE_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="titles">Solo titoli</TabsTrigger>
            <TabsTrigger value="brief">Testo + brief</TabsTrigger>
            <TabsTrigger value="file">Carica file</TabsTrigger>
          </TabsList>

          <TabsContent value="titles" className="mt-4">
            <form onSubmit={onTitlesSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Una riga = un contenuto. Vengono creati vuoti in stato{" "}
                <strong>💡 Da creare</strong>.
              </p>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder={
                  "5 errori nei preventivi edili\nCome pianificare un cantiere senza ritardi\n+800 imprese in 12 mesi"
                }
                className="font-mono text-sm"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{lines.length} righe valide</span>
                <Button type="submit" disabled={creating || lines.length === 0}>
                  {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Crea {lines.length}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="brief" className="mt-4">
            <form onSubmit={onBriefSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Incolla testi separati da <code className="rounded bg-muted px-1">---</code> o
                da heading <code className="rounded bg-muted px-1">#&nbsp;Titolo</code>.
              </p>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                placeholder={`# 5 errori nei preventivi edili\n## Il problema\n...\n\n---\n\n# Pianificazione cantiere\n## Step 1\n...`}
                className="font-mono text-xs"
                autoFocus
              />
              <Button type="submit" disabled={creating || !text.trim()}>
                {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Crea con brief
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Trascina o clicca. Formati supportati:{" "}
              <strong>.md / .txt / .csv / .json / .xlsx / .docx / .pdf</strong>.
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void handleFile(f);
              }}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition ${
                drag
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {parsing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm">Sto leggendo il file…</p>
                </>
              ) : (
                <>
                  <Wand2 className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Trascina qui o clicca</p>
                  <p className="text-[10px] text-muted-foreground">
                    .md / .txt / .csv / .json / .xlsx / .docx / .pdf
                  </p>
                  <input
                    type="file"
                    accept=".md,.markdown,.txt,.csv,.json,.xlsx,.xls,.docx,.pdf"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                    }}
                  />
                </>
              )}
            </div>
            {parsedBriefs.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="mb-2 text-xs font-semibold">
                  📄 {fileName} — {parsedBriefs.length} contenuti rilevati
                </div>
                <ul className="max-h-[180px] space-y-0.5 overflow-y-auto text-xs">
                  {parsedBriefs.slice(0, 20).map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="truncate font-medium">{b.name}</span>
                      {b.brief && (
                        <span className="text-muted-foreground">({b.brief.length} char)</span>
                      )}
                    </li>
                  ))}
                  {parsedBriefs.length > 20 && (
                    <li className="text-muted-foreground">
                      …e altri {parsedBriefs.length - 20}
                    </li>
                  )}
                </ul>
                <div className="mt-3 flex justify-end">
                  <Button onClick={onFileSubmit} disabled={creating}>
                    {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Importa {parsedBriefs.length} {TYPE_META[type].label.toLowerCase()}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
