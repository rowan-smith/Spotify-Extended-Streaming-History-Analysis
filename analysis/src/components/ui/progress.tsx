import { Progress as BaseProgress } from '@base-ui/react/progress';
import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseProgress.Root>) {
  return (
    <BaseProgress.Root
      value={value}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <BaseProgress.Track className="h-full w-full">
        <BaseProgress.Indicator
          className="h-full w-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

export { Progress };
