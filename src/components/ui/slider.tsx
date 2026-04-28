import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SliderExtraProps {
  /** When true, shows a tooltip above the thumb during hover/drag/focus. */
  showTooltip?: boolean;
  /** Format the tooltip text from the current value. */
  formatTooltip?: (value: number) => string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & SliderExtraProps
>(({ className, showTooltip, formatTooltip, value, defaultValue, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const current = (value ?? defaultValue ?? [0])[0] ?? 0;
  const tooltipText = formatTooltip ? formatTooltip(current) : String(current);

  const thumb = (
    <SliderPrimitive.Thumb
      className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
      onFocus={showTooltip ? () => setOpen(true) : undefined}
      onBlur={showTooltip ? () => setOpen(false) : undefined}
      onPointerEnter={showTooltip ? () => setOpen(true) : undefined}
      onPointerLeave={showTooltip ? () => setOpen(false) : undefined}
    />
  );

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      value={value}
      defaultValue={defaultValue}
      onPointerDown={showTooltip ? () => setOpen(true) : undefined}
      onPointerUp={showTooltip ? () => setTimeout(() => setOpen(false), 200) : undefined}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {showTooltip ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip open={open}>
            <TooltipTrigger asChild>{thumb}</TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="px-2 py-1 text-[10px] tabular-nums"
            >
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        thumb
      )}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
