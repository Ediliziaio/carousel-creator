import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  onDismiss: () => void;
}

export function ExportErrorBanner({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1">
        <div className="font-medium text-destructive">Errore durante l'export</div>
        <div className="text-xs text-destructive/90 break-words">{message}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/20"
        onClick={onDismiss}
        aria-label="Chiudi"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
