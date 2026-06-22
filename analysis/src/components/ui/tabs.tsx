import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn(
        'flex items-center border-b border-border gap-0',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors',
        'text-muted-foreground hover:text-foreground',
        'aria-selected:text-foreground',
        'aria-selected:after:absolute aria-selected:after:bottom-0 aria-selected:after:left-0 aria-selected:after:right-0 aria-selected:after:h-0.5 aria-selected:after:bg-accent aria-selected:after:rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof BaseTabs.Panel>) {
  return (
    <BaseTabs.Panel
      className={cn('mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
      {...props}
    />
  );
}

const TabsRoot = BaseTabs.Root;

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent };
