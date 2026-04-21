import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useCarousel } from "@/lib/store";
import { getSlideData } from "@/lib/i18n";
import type { Slide, AnyTemplateData } from "@/lib/templates";

export function JsonEditor({ slide }: { slide: Slide }) {
  const update = useCarousel((s) => s.updateSlide);
  const lang = useCarousel((s) => s.activeLang);
  const defaultLang = useCarousel((s) => s.brand.defaultLanguage);
  const data = getSlideData(slide, lang, defaultLang);

  const [text, setText] = useState(() => JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
    setError(null);
  }, [slide.id, data]);

  const onChange = (v: string) => {
    setText(v);
    try {
      const parsed = JSON.parse(v) as AnyTemplateData;
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
