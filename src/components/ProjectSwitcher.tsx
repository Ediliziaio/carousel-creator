import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, FolderKanban, Check, ArrowLeft, Loader2 } from "lucide-react";
import { listProjects, type ProjectRow } from "@/lib/projectsApi";

interface Props {
  /** ID progetto attivo (per highlight). */
  currentProjectId: string;
  /** Nome corrente, mostrato nel trigger. */
  currentName?: string;
}

/**
 * Dropdown nel header del builder: mostra il progetto corrente e permette di
 * passare a un altro progetto in 2 click. Sostituisce la freccia "back" con un
 * elemento più informativo.
 */
export function ProjectSwitcher({ currentProjectId, currentName }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || projects.length > 0) return;
    setLoading(true);
    void listProjects()
      .then((p) => setProjects(p))
      .finally(() => setLoading(false));
  }, [open, projects.length]);

  const goToProject = (id: string) => {
    setOpen(false);
    void navigate({ to: "/projects/$projectId", params: { projectId: id } });
  };

  const goToList = () => {
    setOpen(false);
    void navigate({ to: "/projects" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 max-w-[220px] gap-1.5 px-2 text-xs"
          title="Cambia progetto"
        >
          <FolderKanban className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">{currentName ?? "Progetto"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <button
          type="button"
          onClick={goToList}
          className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tutti i progetti
        </button>
        <div className="my-1 h-px bg-border" />
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Cambia progetto
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Caricamento…
          </div>
        ) : (
          <div className="max-h-[280px] space-y-0.5 overflow-y-auto">
            {projects.map((p) => {
              const active = p.id === currentProjectId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goToProject(p.id)}
                  className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-muted ${
                    active ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    {p.description && (
                      <div className="truncate text-[10px] text-muted-foreground">
                        {p.description}
                      </div>
                    )}
                  </div>
                  {active && <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
