import { useCarousel } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { TextStyle } from "@/lib/templates";

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

const FALLBACK = 64;

function defaultFor(fieldPath: string): number {
  if (FIELD_DEFAULTS[fieldPath] != null) return FIELD_DEFAULTS[fieldPath];
  // Match prefix before first "." (e.g. paragraphs.0 -> paragraphs).
  const root = fieldPath.split(".")[0];
  if (FIELD_DEFAULTS[root] != null) return FIELD_DEFAULTS[root];
  // Match suffix (e.g. items.0.title -> title, cells.2.text -> text).
  const tail = fieldPath.split(".").pop() ?? "";
  if (FIELD_DEFAULTS[tail] != null) return FIELD_DEFAULTS[tail];
  return FALLBACK;
}

export function FontSizeSlider({
  slideId,
  fieldPath,
  value,
  defaultSize,
  compact = false,
}: FontSizeSliderProps) {
  const setTextOverride = useCarousel((s) => s.setTextOverride);

  const overridden = value?.fontSize != null;
  const baseDefault = defaultSize ?? defaultFor(fieldPath);
  const current = value?.fontSize ?? baseDefault;

  const onChange = (next: number) => {
    setTextOverride(slideId, fieldPath, { ...(value ?? {}), fontSize: next });
  };

  const onReset = () => {
    if (!value) return;
    const { fontSize: _omit, ...rest } = value;
    void _omit;
    setTextOverride(slideId, fieldPath, rest);
  };

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "min-w-[120px]"}`}>
      <Slider
        min={16}
        max={240}
        step={2}
        value={[current]}
        onValueChange={([v]) => onChange(v)}
        className={compact ? "w-[60px]" : "w-[80px]"}
        title={`Dimensione font: ${current}px${overridden ? "" : " (default)"}`}
      />
      {!compact && (
        <span
          className={`min-w-[34px] text-right text-[10px] tabular-nums ${overridden ? "text-foreground" : "text-muted-foreground"}`}
        >
          {current}
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
