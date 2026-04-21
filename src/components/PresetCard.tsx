import type { BrandPreset } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface PresetCardProps {
  preset: BrandPreset;
  isCurrent?: boolean;
  onApply: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}

export function PresetCard({ preset, isCurrent, onApply, onRename, onDelete }: PresetCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(preset.name);
  const t = preset.theme;

  const swatches = [t.bgColor, t.accent, t.accentSecondary, t.textColor];

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-md border p-3 transition-colors ${
        isCurrent ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
    >
      <div
        className="flex h-16 items-center justify-center overflow-hidden rounded-sm"
        style={{ background: t.bgColor }}
      >
        <span
          style={{
            fontFamily: `'${t.fontHeading}', system-ui`,
            fontWeight: t.headingWeight,
            color: t.accent,
            fontSize: 22,
            letterSpacing: "-0.01em",
          }}
        >
          Aa
        </span>
        <span
          style={{
            fontFamily: `'${t.fontBody}', system-ui`,
            fontWeight: t.bodyWeight,
            color: t.textColor,
            fontSize: 14,
            marginLeft: 8,
          }}
        >
          body
        </span>
      </div>

      <div className="flex gap-1">
        {swatches.map((c, i) => (
          <span
            key={i}
            className="h-3 flex-1 rounded-sm border border-border/50"
            style={{ background: c }}
          />
        ))}
      </div>

      <div className="flex items-start justify-between gap-2">
        {editing && onRename ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== preset.name) onRename(name.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (name.trim() && name !== preset.name) onRename(name.trim());
                setEditing(false);
              }
              if (e.key === "Escape") {
                setName(preset.name);
                setEditing(false);
              }
            }}
            className="h-7 text-xs"
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{preset.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {preset.builtIn ? "Built-in" : "Custom"}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant={isCurrent ? "default" : "secondary"} className="h-7 flex-1 text-xs" onClick={onApply}>
          <Check className="mr-1 h-3 w-3" /> {isCurrent ? "Applicato" : "Applica"}
        </Button>
        {onRename && !preset.builtIn && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)} title="Rinomina">
            <Pencil className="h-3 w-3" />
          </Button>
        )}
        {onDelete && !preset.builtIn && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete} title="Elimina">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
