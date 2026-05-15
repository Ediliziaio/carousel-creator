import { useState, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

/**
 * Wrapper Collapsible "Avanzate ▾" da usare nei SlideEditor con tanti campi.
 * Default chiuso → l'utente vede solo i campi essenziali, espande per il resto.
 */
export function AdvancedFields({
  label = "Campi avanzati",
  hint,
  defaultOpen = false,
  children,
}: {
  label?: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground transition hover:border-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
          <span>{label}</span>
          {hint && <span className="text-[10px] font-normal opacity-70">— {hint}</span>}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}
