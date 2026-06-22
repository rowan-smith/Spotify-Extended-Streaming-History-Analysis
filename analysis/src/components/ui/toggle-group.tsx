import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { cn } from '@/lib/utils';

const ToggleGroup = BaseToggleGroup;

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Toggle>) {
  return (
    <Toggle
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors border border-border bg-muted text-foreground hover:bg-muted/80 data-[pressed]:bg-accent data-[pressed]:border-accent data-[pressed]:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
