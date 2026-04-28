import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { useCarousel } from "@/lib/store";
import { FONT_OPTIONS, type FontChoice, type TextStyle, type Weight } from "@/lib/templates";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Underline,
  CaseUpper,
  RotateCcw,
} from "lucide-react";

interface Props {
  slideId: string;
  fieldPath: string;
  /** Current override for this field (if any). */
  value?: TextStyle;
}

const WEIGHTS: Weight[] = [400, 500, 600, 700, 800, 900];

export function TextStylePopover({ slideId, fieldPath, value }: Props) {
  const setTextOverride = useCarousel((s) => s.setTextOverride);
  const clearTextOverride = useCarousel((s) => s.clearTextOverride);
  const brand = useCarousel((s) => s.brand);

  const active = !!value && Object.keys(value).length > 0;

  const colorSwatches = useMemo(
    () => [
      { name: "Testo", value: brand.textColor },
      { name: "Accent", value: brand.accent },
      { name: "Accent 2", value: brand.accentSecondary },
      { name: "Bianco", value: "#FFFFFF" },
      { name: "Nero", value: "#000000" },
    ],
    [brand.textColor, brand.accent, brand.accentSecondary],
  );

  const set = (patch: Partial<TextStyle>) => {
    setTextOverride(slideId, fieldPath, { ...(value ?? {}), ...patch });
  };
  const clear = (key: keyof TextStyle) => {
    if (!value) return;
    const { [key]: _omit, ...rest } = value;
    void _omit;
    if (Object.keys(rest).length === 0) {
      clearTextOverride(slideId, fieldPath);
    } else {
      setTextOverride(slideId, fieldPath, rest);
    }
  };

  const fontSize = value?.fontSize ?? 64;
  const letterSpacing = value?.letterSpacing ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? "default" : "ghost"}
          size="icon"
          className="h-6 w-6"
          title="Stile testo"
        >
          <Type className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="end">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stile testo
          </div>
          {active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => clearTextOverride(slideId, fieldPath)}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reset
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Font</Label>
          <Select
            value={value?.fontFamily ?? "__inherit"}
            onValueChange={(v) =>
              v === "__inherit" ? clear("fontFamily") : set({ fontFamily: v as FontChoice })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__inherit">Default brand</SelectItem>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: `'${f}', system-ui` }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dimensione
            </Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">{fontSize}px</span>
          </div>
          <Slider
            min={16}
            max={240}
            step={2}
            value={[fontSize]}
            onValueChange={([v]) => set({ fontSize: v })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso</Label>
          <Select
            value={value?.fontWeight ? String(value.fontWeight) : "__inherit"}
            onValueChange={(v) =>
              v === "__inherit" ? clear("fontWeight") : set({ fontWeight: Number(v) as Weight })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__inherit">Default</SelectItem>
              {WEIGHTS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Spaziatura lettere
            </Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {letterSpacing.toFixed(2)}em
            </span>
          </div>
          <Slider
            min={-0.05}
            max={0.3}
            step={0.01}
            value={[letterSpacing]}
            onValueChange={([v]) => set({ letterSpacing: v })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Allineamento
          </Label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => {
              const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
              return (
                <Toggle
                  key={a}
                  size="sm"
                  pressed={value?.textAlign === a}
                  onPressedChange={(on) => (on ? set({ textAlign: a }) : clear("textAlign"))}
                  className="h-8 flex-1"
                >
                  <Icon className="h-3.5 w-3.5" />
                </Toggle>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Stile
          </Label>
          <div className="flex gap-1">
            <Toggle
              size="sm"
              pressed={!!value?.italic}
              onPressedChange={(on) => (on ? set({ italic: true }) : clear("italic"))}
              className="h-8 flex-1"
            >
              <Italic className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={!!value?.uppercase}
              onPressedChange={(on) => (on ? set({ uppercase: true }) : clear("uppercase"))}
              className="h-8 flex-1"
            >
              <CaseUpper className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={!!value?.underline}
              onPressedChange={(on) => (on ? set({ underline: true }) : clear("underline"))}
              className="h-8 flex-1"
            >
              <Underline className="h-3.5 w-3.5" />
            </Toggle>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Colore
          </Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {colorSwatches.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                onClick={() => set({ color: c.value })}
                className={`h-7 w-7 rounded-md border-2 ${
                  value?.color?.toLowerCase() === c.value.toLowerCase()
                    ? "border-primary"
                    : "border-border"
                }`}
                style={{ background: c.value }}
              />
            ))}
            <input
              type="color"
              value={value?.color ?? brand.textColor}
              onChange={(e) => set({ color: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded-md border border-border bg-transparent"
              title="Colore custom"
            />
            {value?.color && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-[10px]"
                onClick={() => clear("color")}
              >
                Reset colore
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
