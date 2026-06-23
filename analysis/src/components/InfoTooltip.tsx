import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface InfoTooltipProps {
  text: string;
  label?: string;
}

const INFO_ICON = '\u24D8';

const triggerClassName =
  'inline-flex items-center align-middle text-[0.85em] leading-none cursor-help shrink-0 touch-manipulation text-current/70';

export function InfoTooltip({ text, label = 'More information' }: InfoTooltipProps) {
  const isTouchLike = useMediaQuery('(hover: none), (pointer: coarse)');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          delay={isTouchLike ? 0 : undefined}
          render={
            isTouchLike ? (
              <button type="button" className={triggerClassName} aria-label={label} />
            ) : (
              <span
                className={triggerClassName}
                tabIndex={0}
                aria-label={label}
                title={undefined}
              />
            )
          }
        >
          {INFO_ICON}
        </TooltipTrigger>
        <TooltipContent className="text-xs leading-relaxed">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
