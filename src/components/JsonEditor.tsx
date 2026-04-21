import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useCarousel } from "@/lib/store";
import type { Slide } from "@/lib/templates";

export function JsonEditor({ slide }: { slide: Slide }) {
  const update = useCarousel((s) => s.updateSlide);
  const [text, setText] = useState(() => JSON.stringify(slide.data, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(slide.data, null, 2));
    setError(null);
  }, [slide.id, slide.data]);

  const onChange = (v: string) => {
    setText(v);
    try {
      const parsed = JSON.parse(v);
      update(slide.id, parsed);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={28}
        className="font-mono text-xs"
      />
      {error && <p className="text-xs text-destructive">JSON non valido: {error}</p>}
    </div>
  );
}
