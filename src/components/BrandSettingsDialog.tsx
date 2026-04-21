import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCarousel } from "@/lib/store";
import { Settings } from "lucide-react";

const PRESETS = [
  { name: "Ciano", value: "#00E5FF" },
  { name: "Magenta", value: "#B24BF3" },
  { name: "Lime", value: "#A6FF00" },
  { name: "Arancio", value: "#FF7A1A" },
  { name: "Bianco", value: "#FFFFFF" },
];

export function BrandSettingsDialog() {
  const [open, setOpen] = useState(false);
  const brand = useCarousel((s) => s.brand);
  const setBrand = useCarousel((s) => s.setBrand);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-1 h-4 w-4" /> Brand
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impostazioni brand</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome brand (header)</Label>
            <Input value={brand.brand} onChange={(e) => setBrand({ brand: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Handle (footer)</Label>
            <Input value={brand.handle} onChange={(e) => setBrand({ handle: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Footer destro (CTA)</Label>
            <Input value={brand.footerCta} onChange={(e) => setBrand({ footerCta: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Colore accent</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={brand.accent}
                onChange={(e) => setBrand({ accent: e.target.value })}
                className="h-9 w-16 cursor-pointer p-1"
              />
              <Input value={brand.accent} onChange={(e) => setBrand({ accent: e.target.value })} className="font-mono" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setBrand({ accent: p.value })}
                  className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: p.value }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
