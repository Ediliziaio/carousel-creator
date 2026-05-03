import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImageIcon,
  Images,
  Loader2,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";
import { getProject, type ProjectRow } from "@/lib/projectsApi";
import {
  listContents,
  deleteContent,
  saveContent,
  type ContentRow,
  type ContentType,
} from "@/lib/contentsApi";
import { UserMenu } from "@/components/UserMenu";

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

function ProjectDashboard() {
  const { projectId } = useParams({ from: "/projects/$projectId/" });
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContentType>("carousel");

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

  const grouped = useMemo(() => {
    return {
      post: items.filter((i) => i.type === "post"),
      carousel: items.filter((i) => i.type === "carousel"),
      story: items.filter((i) => i.type === "story"),
    };
  }, [items]);

  async function onCreate(type: ContentType) {
    try {
      const row = await saveContent({
        projectId,
        type,
        name: TYPE_META[type].defaultName,
        data: { brand: project?.brand ?? null, slides: [], activeLang: "it" },
      });
      void navigate({
        to: "/projects/$projectId/builder/$contentId",
        params: { projectId, contentId: row.id },
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDeleteContent(id: string) {
    if (!confirm("Eliminare questo contenuto?")) return;
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Caricamento…
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as ContentType)}>
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

            {(Object.keys(TYPE_META) as ContentType[]).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              const list = grouped[t];
              return (
                <TabsContent key={t} value={t} className="mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                    <Button onClick={() => onCreate(t)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuovo {meta.label.toLowerCase()}
                    </Button>
                  </div>

                  {list.length === 0 ? (
                    <Card className="flex flex-col items-center gap-3 py-16 text-center">
                      <Icon className="h-10 w-10 text-muted-foreground" />
                      <p className="font-medium">Nessun {meta.label.toLowerCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        Crea il primo per iniziare.
                      </p>
                      <Button onClick={() => onCreate(t)} className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Crea
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {list.map((c) => (
                        <Card key={c.id} className="group relative overflow-hidden p-4 transition hover:shadow-md">
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
                            <h3 className="mt-3 truncate font-medium text-foreground">
                              {c.name}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(c.updated_at).toLocaleDateString("it-IT", {
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
                              void onDeleteContent(c.id);
                            }}
                            className="absolute right-2 top-2 rounded-md bg-card/80 p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </main>
    </div>
  );
}
