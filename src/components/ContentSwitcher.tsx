import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Check,
  Loader2,
  ImageIcon,
  Images,
  Smartphone,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { listContents, type ContentRow, type ContentType } from "@/lib/contentsApi";

interface Props {
  projectId: string;
  currentContentId: string;
  currentName?: string;
  currentType?: ContentType;
}

const TYPE_ICON: Record<ContentType, React.ComponentType<{ className?: string }>> = {
  post: ImageIcon,
  carousel: Images,
  story: Smartphone,
};

const TYPE_LABEL: Record<ContentType, string> = {
  post: "Post",
  carousel: "Carosello",
  story: "Storia",
};

/**
 * Dropdown nel header builder per saltare tra contenuti dello stesso progetto.
 * Mostra anche stato published/draft (letto da data.status) per ogni voce.
 */
export function ContentSwitcher({
  projectId,
  currentContentId,
  currentName,
  currentType,
}: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || items.length > 0) return;
    setLoading(true);
    void listContents(projectId)
      .then((rows) => setItems(rows))
      .finally(() => setLoading(false));
  }, [open, items.length, projectId]);

  const goTo = (id: string) => {
    setOpen(false);
    void navigate({
      to: "/projects/$projectId/builder/$contentId",
      params: { projectId, contentId: id },
    });
  };

  const CurrentIcon = currentType ? TYPE_ICON[currentType] : Images;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 max-w-[200px] gap-1.5 px-2 text-xs"
          title="Cambia contenuto"
        >
          <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">{currentName ?? "…"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contenuti del progetto
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Caricamento…
          </div>
        ) : (
          <div className="max-h-[320px] space-y-0.5 overflow-y-auto">
            {items.map((c) => {
              const Icon = TYPE_ICON[c.type];
              const active = c.id === currentContentId;
              const status =
                ((c.data as { status?: string })?.status ?? "draft") === "published"
                  ? "published"
                  : "draft";
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goTo(c.id)}
                  className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-muted ${
                    active ? "bg-primary/5" : ""
                  }`}
                >
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{c.name}</span>
                      {status === "published" ? (
                        <CircleCheck className="h-3 w-3 shrink-0 text-green-600" aria-label="Pubblicato" />
                      ) : (
                        <CircleDashed
                          className="h-3 w-3 shrink-0 text-muted-foreground"
                          aria-label="Bozza"
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {TYPE_LABEL[c.type]} · {status === "published" ? "Pubblicato" : "Bozza"}
                    </div>
                  </div>
                  {active && <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
            {items.length === 0 && (
              <div className="py-4 text-center text-[11px] text-muted-foreground">
                Nessun altro contenuto in questo progetto.
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
