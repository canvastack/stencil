import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const PortalTooltipProvider = TooltipPrimitive.Provider;

const PortalTooltip = TooltipPrimitive.Root;

const PortalTooltipTrigger = TooltipPrimitive.Trigger;

const PortalTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    container?: Element | null;
  }
>(({ className, sideOffset = 4, container, children, ...props }, ref) => {
  const content = (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[9999] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  );

  // Use portal to render tooltip in document.body to avoid overflow issues
  if (typeof window !== 'undefined') {
    return createPortal(content, container || document.body);
  }

  return content;
});
PortalTooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { PortalTooltip, PortalTooltipTrigger, PortalTooltipContent, PortalTooltipProvider };