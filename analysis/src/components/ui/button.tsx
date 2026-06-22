import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'outline' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70',
          variant === 'default' && 'bg-primary text-primary-foreground hover:brightness-110',
          variant === 'primary' && 'bg-accent text-accent-foreground hover:brightness-110',
          variant === 'ghost' && 'bg-muted text-foreground border border-border hover:bg-muted/80',
          variant === 'outline' && 'border border-border bg-transparent hover:bg-muted',
          variant === 'link' && 'text-accent underline-offset-4 hover:underline',
          size === 'default' && 'h-10 px-5 py-2',
          size === 'sm' && 'h-10 sm:h-9 rounded-full px-3 text-xs',
          size === 'lg' && 'h-12 rounded-full px-6 text-base',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
