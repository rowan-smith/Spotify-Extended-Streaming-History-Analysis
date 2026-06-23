import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = BaseTooltip.Provider;
const TooltipRoot = BaseTooltip.Root;
const TooltipTrigger = BaseTooltip.Trigger;

const viewportCollisionAvoidance = {
  side: 'flip',
  align: 'shift',
  fallbackAxisSide: 'none',
} as const;

function TooltipPopup({ className, ...props }: React.ComponentPropsWithoutRef<typeof BaseTooltip.Popup>) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        sideOffset={4}
        collisionPadding={8}
        collisionAvoidance={viewportCollisionAvoidance}
      >
        <BaseTooltip.Popup
          className={cn(
            'z-50 max-w-[min(15rem,calc(100vw-1rem))] rounded-md border bg-background px-3 py-1.5 text-sm text-popover-foreground shadow-md',
            'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
            'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
            'transition-[opacity,transform] duration-150',
            className,
          )}
          {...props}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}

export { TooltipProvider as TooltipProvider, TooltipRoot as Tooltip, TooltipTrigger as TooltipTrigger, TooltipPopup as TooltipContent };
