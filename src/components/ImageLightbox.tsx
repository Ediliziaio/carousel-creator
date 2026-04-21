import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src?: string;
  alt?: string;
  caption?: string;
}

export function ImageLightbox({ open, onOpenChange, src, alt, caption }: Props) {
  if (!src) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] max-w-[95vw] flex-col items-center justify-center gap-3 border-none bg-black/95 p-2 sm:max-w-[90vw] sm:p-6">
        <VisuallyHidden>
          <DialogTitle>{alt ?? "Anteprima immagine"}</DialogTitle>
          <DialogDescription>Clicca fuori, premi ESC o usa la X per chiudere.</DialogDescription>
        </VisuallyHidden>
        <img
          src={src}
          alt={alt ?? "Anteprima"}
          className="max-h-[85vh] max-w-full rounded-md object-contain"
        />
        {caption && (
          <p className="max-w-2xl text-center text-sm text-white/80">{caption}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
