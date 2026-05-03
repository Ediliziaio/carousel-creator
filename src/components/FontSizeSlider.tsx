import { useCarousel } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";
import type { TextStyle } from "@/lib/templates";
import type { ChangeEvent, KeyboardEvent } from "react";

interface FontSizeSliderProps {
  slideId: string;
  fieldPath: string;
  /** Current override for this field (if any). */
  value?: TextStyle;
  /** Default visual size when no override is set (placeholder thumb position). */
  defaultSize?: number;
  /** Compact mode: narrower slider, no numeric input/label. */
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

/** Extract the field "type" key from a fieldPath (root segment, e.g. "items.0.title" → "title"). */
function fieldTypeOf(fieldPath: string): string {
  const parts = fieldPath.split(".");
  const tail = parts[parts.length - 1];
  if (FIELD_DEFAULTS[tail] != null) return tail;
  const root = parts[0];
  if (FIELD_DEFAULTS[root] != null) return root;
  return tail || root || fieldPath;
}

function staticDefaultFor(fieldPath: string): number {
  const t = fieldTypeOf(fieldPath);
  return FIELD_DEFAULTS[t] ?? FALLBACK;
}

const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));

/**
 * Inline font-size slider with numeric input, live tooltip, and per-type memory.
 * Stateless: derived from `value` prop + store. Memory of last value per field
 * type is read from `lastFontSizeByFieldType` and used as base default when no
 * override exists on the current field.
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
  const lastByType = useCarousel((s) => s.lastFontSizeByFieldType);
  const setLastFontSizeForFieldType = useCarousel((s) => s.setLastFontSizeForFieldType);

  const overridden = value?.fontSize != null;
  const typeKey = fieldTypeOf(fieldPath);
  const remembered = lastByType[typeKey];
  const baseDefault = defaultSize ?? remembered ?? staticDefaultFor(fieldPath);
  const current = value?.fontSize ?? baseDefault;

  const commit = (next: number) => {
    const clamped = clamp(next);
    setTextOverride(slideId, fieldPath, { ...(value ?? {}), fontSize: clamped });
    setLastFontSizeForFieldType(typeKey, clamped);
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

  // Click on default value pin: applies the current visual value as an explicit override.
  const onPinDefault = () => {
    if (overridden) return;
    commit(current);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") return; // allow transient empty during editing
    const n = Number(raw);
    if (Number.isFinite(n)) commit(n);
  };

  const onInputBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (e.target.value === "" || !Number.isFinite(n)) {
      // restore visual: handled automatically since value prop drives input
      e.target.value = String(current);
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
      commit(next);
    }
  };

  const inputTitle = overridden
    ? `${current}px (personalizzato)`
    : remembered != null
      ? `${current}px* — ultimo valore usato per "${typeKey}". Modifica per personalizzare.`
      : `${current}px* — default del template. Modifica per personalizzare.`;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "min-w-[140px]"}`}>
      <Slider
        min={MIN}
        max={MAX}
        step={2}
        value={[current]}
        onValueChange={([v]) => commit(v)}
        onKeyDown={onKeyDown}
        showTooltip
        formatTooltip={(v) => `${v}px`}
        aria-label="Dimensione font in pixel"
        aria-valuetext={`${current}px${overridden ? "" : " (default)"}`}
        className={compact ? "w-[60px]" : "w-[80px]"}
        title={`Dimensione font: ${current}px${overridden ? "" : " (default)"} — frecce ±2, Shift+frecce ±10, PageUp/Down ±20, Home/End min/max`}
      />
      {!compact && (
        <div className="relative">
          <Input
            type="number"
            min={MIN}
            max={MAX}
            step={2}
            value={current}
            onChange={onInputChange}
            onBlur={onInputBlur}
            onClick={overridden ? undefined : onPinDefault}
            className={`h-7 w-14 px-1 pr-3 text-[11px] tabular-nums shadow-none ${
              overridden
                ? "border-primary/40 bg-primary/5 font-medium"
                : "text-muted-foreground"
            }`}
            title={inputTitle}
            aria-label="Dimensione font in pixel"
          />
          {/* Dot indicator: pieno = override custom, vuoto = default */}
          <span
            className={`pointer-events-none absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${
              overridden ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          />
        </div>
      )}
      {overridden && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={onReset}
          title="Reset dimensione font"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
