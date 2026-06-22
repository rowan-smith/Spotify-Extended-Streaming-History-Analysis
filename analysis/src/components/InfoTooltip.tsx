import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface InfoTooltipProps {
  text: string;
  label?: string;
}

export function InfoTooltip({ text, label = 'More information' }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className="inline-grid place-items-center w-3 h-3 rounded-full border border-current/40 text-[0.5rem] font-bold italic cursor-help shrink-0"
              tabIndex={0}
              aria-label={label}
              title={undefined}
            />
          }
        >
          i
        </TooltipTrigger>
        <TooltipContent className="max-w-60">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
