import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'accent' && 'bg-accent/20 text-accent border border-accent/30',
        variant === 'outline' && 'border border-border text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
