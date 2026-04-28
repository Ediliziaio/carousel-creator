import { ChevronLeft, ChevronRight, X, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FlatIssue {
  slideId: string;
  slideIndex: number;
  templateLabel: string;
  field: string;
  message: string;
  severity?: "error" | "warning";
}

interface Props {
  issues: FlatIssue[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function FixIssuesGuide({ issues, index, onPrev, onNext, onSkip, onClose }: Props) {
  if (issues.length === 0) return null;
  const safeIndex = Math.min(Math.max(0, index), issues.length - 1);
  const cur = issues[safeIndex];
  if (!cur) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onPrev}
          disabled={safeIndex === 0}
          title="Errore precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col px-2 text-xs leading-tight">
          <div className="font-semibold text-destructive">
            Errore {safeIndex + 1} di {issues.length}
          </div>
          <div className="text-muted-foreground">
            Slide {(cur.slideIndex + 1).toString().padStart(2, "0")} · {cur.templateLabel} ·{" "}
            <span className="text-foreground">{cur.message}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={onSkip}
          title="Salta questo errore"
        >
          <SkipForward className="mr-1 h-3 w-3" /> Salta
        </Button>

        <Button
          variant="default"
          size="sm"
          className="h-7"
          onClick={onNext}
          disabled={safeIndex >= issues.length - 1}
          title="Errore successivo"
        >
          Succ <ChevronRight className="ml-1 h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          title="Chiudi guida"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
