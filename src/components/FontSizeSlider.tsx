import { useCarousel } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { TextStyle } from "@/lib/templates";
import type { KeyboardEvent } from "react";

interface FontSizeSliderProps {
  slideId: string;
  fieldPath: string;
  /** Current override for this field (if any). */
  value?: TextStyle;
  /** Default visual size when no override is set (placeholder thumb position). */
  defaultSize?: number;
  /** Compact mode: narrower slider, no numeric label. */
  compact?: boolean;
}

const FIELD_DEFAULTS: Record<string, number> = {
  eyebrow: 22,
  title: 88,
  subtitle: 44,
  sub: 36,
  paragraphs: 32,
  list: 32,
  quote: 56,
  author: 28,
  role: 22,
  value: 180,
  number: 180,
  numberSub: 28,
  label: 28,
  word: 120,
  def: 36,
  example: 28,
  question: 56,
  answer: 32,
  category: 22,
  meta: 22,
  caption: 22,
};

const MIN = 16;
const MAX = 240;
const FALLBACK = 64;

function defaultFor(fieldPath: string): number {
  if (FIELD_DEFAULTS[fieldPath] != null) return FIELD_DEFAULTS[fieldPath];
  const root = fieldPath.split(".")[0];
  if (FIELD_DEFAULTS[root] != null) return FIELD_DEFAULTS[root];
  const tail = fieldPath.split(".").pop() ?? "";
  if (FIELD_DEFAULTS[tail] != null) return FIELD_DEFAULTS[tail];
  return FALLBACK;
}

const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));

/**
 * Inline font-size slider. Stateless: derived from `value` prop + store action.
 * Consumers should pass a stable `key={`${slideId}:${fieldPath}`}` if they
 * need to force a fresh mount on field/slide change (usually not necessary,
 * since React reconciles props on re-render).
 */
export function FontSizeSlider({
  slideId,
  fieldPath,
  value,
  defaultSize,
  compact = false,
}: FontSizeSliderProps) {
  const setTextOverride = useCarousel((s) => s.setTextOverride);
  const clearTextOverride = useCarousel((s) => s.clearTextOverride);

  const overridden = value?.fontSize != null;
  const baseDefault = defaultSize ?? defaultFor(fieldPath);
  const current = value?.fontSize ?? baseDefault;

  const onChange = (next: number) => {
    setTextOverride(slideId, fieldPath, { ...(value ?? {}), fontSize: clamp(next) });
  };

  const onReset = () => {
    if (!value) return;
    const { fontSize: _omit, ...rest } = value;
    void _omit;
    if (Object.keys(rest).length === 0) {
      clearTextOverride(slideId, fieldPath);
    } else {
      setTextOverride(slideId, fieldPath, rest);
    }
  };

  // Custom keyboard shortcuts on top of Radix defaults (Arrow ±step, Home/End).
  // Shift+Arrow → ±10px, PageUp/PageDown → ±20px.
  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    let next: number | null = null;
    if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowRight")) {
      next = current + 10;
    } else if (e.shiftKey && (e.key === "ArrowDown" || e.key === "ArrowLeft")) {
      next = current - 10;
    } else if (e.key === "PageUp") {
      next = current + 20;
    } else if (e.key === "PageDown") {
      next = current - 20;
    }
    if (next != null) {
      e.preventDefault();
      e.stopPropagation();
      onChange(next);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "min-w-[120px]"}`}>
      <Slider
        min={MIN}
        max={MAX}
        step={2}
        value={[current]}
        onValueChange={([v]) => onChange(v)}
        onKeyDown={onKeyDown}
        aria-label="Dimensione font in pixel"
        aria-valuetext={`${current}px${overridden ? "" : " (default)"}`}
        className={compact ? "w-[60px]" : "w-[80px]"}
        title={`Dimensione font: ${current}px${overridden ? "" : " (default)"} — frecce ±2, Shift+frecce ±10, PageUp/Down ±20, Home/End min/max`}
      />
      {!compact && (
        <span
          className={`min-w-[34px] text-right text-[10px] tabular-nums ${overridden ? "text-foreground" : "text-muted-foreground"}`}
          title={
            overridden
              ? `${current}px (personalizzato)`
              : `${current}px — valore default del template, trascina o usa le frecce per personalizzare`
          }
        >
          {current}
          {!overridden && <span className="ml-px opacity-60">*</span>}
        </span>
      )}
      {overridden && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={onReset}
          title="Reset dimensione"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
