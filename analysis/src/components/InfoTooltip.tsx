import { useEffect, useId, useRef, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open || !isTouchLike) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, isTouchLike]);

  if (isTouchLike) {
    return (
      <span ref={rootRef} className="relative inline-flex align-middle">
        <button
          type="button"
          className={triggerClassName}
          aria-label={label}
          aria-expanded={open}
          aria-controls={tooltipId}
          onClick={() => setOpen((value) => !value)}
        >
          {INFO_ICON}
        </button>
        {open ? (
          <span
            id={tooltipId}
            role="tooltip"
            className="absolute z-50 bottom-[calc(100%+0.35rem)] left-1/2 -translate-x-1/2 w-60 max-w-[70vw] rounded-md border border-border bg-background px-3 py-2 text-xs text-popover-foreground shadow-md leading-relaxed"
          >
            {text}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={triggerClassName}
              tabIndex={0}
              aria-label={label}
              title={undefined}
            />
          }
        >
          {INFO_ICON}
        </TooltipTrigger>
        <TooltipContent className="max-w-60">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
