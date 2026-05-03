import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Wand2, Scissors, Zap, Plus } from "lucide-react";
import { rewriteText, type RewriteMode } from "@/lib/aiRewrite";
import { toast } from "sonner";

interface Props {
  /** Testo corrente da migliorare. */
  value: string;
  /** Callback quando l'utente seleziona una variante. */
  onApply: (newText: string) => void;
  /** Contesto opzionale (es. "hook", "cta") per indirizzare l'AI. */
  context?: string;
  /** Disabilita il bottone se il testo è troppo corto/vuoto. */
  disabled?: boolean;
}

const MODES: { id: RewriteMode; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "rewrite", label: "Riscrivi", icon: Wand2, desc: "3 versioni con diverso tono" },
  { id: "shorten", label: "Accorcia", icon: Scissors, desc: "3 versioni più corte" },
  { id: "punchier", label: "Più punchy", icon: Zap, desc: "3 versioni più dirette" },
  { id: "expand", label: "Espandi", icon: Plus, desc: "3 versioni con più dettaglio" },
];

/**
 * Bottoncino "Sparkles" che apre un popover con 4 modalità di riscrittura AI.
 * Al click chiama Cloudflare Workers AI (Llama 3.1 8B) tramite /api/ai-rewrite,
 * mostra 3 varianti, l'utente clicca su una per applicarla al campo.
 *
 * Costo: 0 (free tier Cloudflare AI). Funziona in produzione SE le env vars
 * CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_TOKEN sono settate su Cloudflare Pages.
 * In dev locale fallisce con "AI non configurata" — è il comportamento atteso.
 */
export function AIRewriteButton({ value, onApply, context, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<RewriteMode | null>(null);
  const tooShort = !value || value.trim().length < 4;

  async function run(mode: RewriteMode) {
    if (tooShort) return;
    setLoading(true);
    setActiveMode(mode);
    setVariants([]);
    try {
      const v = await rewriteText(value, mode, context);
      if (v.length === 0) {
        toast.error("Nessuna variante generata. Riprova.");
      } else {
        setVariants(v);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          disabled={disabled || tooShort}
          title={
            tooShort
              ? "Scrivi qualcosa per usare l'AI (min 4 caratteri)"
              : "Migliora con AI (gratis, Cloudflare Llama)"
          }
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-3" align="end">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ✨ Migliora con AI
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id && loading;
            return (
              <Button
                key={m.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void run(m.id)}
                disabled={loading}
                className="justify-start gap-1.5 h-auto py-2"
                title={m.desc}
              >
                {isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="text-xs">{m.label}</span>
              </Button>
            );
          })}
        </div>
        {variants.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Click per applicare
            </div>
            {variants.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onApply(v);
                  setOpen(false);
                  setVariants([]);
                  toast.success("Variante applicata");
                }}
                className="block w-full rounded-md border border-border bg-card p-2 text-left text-xs leading-snug transition hover:border-primary hover:bg-primary/5"
              >
                {v}
              </button>
            ))}
          </div>
        )}
        {!loading && variants.length === 0 && (
          <p className="mt-3 text-[10px] text-muted-foreground">
            Genera 3 varianti del tuo testo. Costo: 0 (Cloudflare AI free tier).
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
