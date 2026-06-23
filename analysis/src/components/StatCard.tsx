import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  info?: string;
  variant?: 'default' | 'hero' | 'compact';
}

export function StatCard({ label, value, hint, info, variant = 'default' }: StatCardProps) {
  if (variant === 'compact') {
    return (
      <Card className="p-3">
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 leading-snug">
          <span className="min-w-0">{label}</span>
          {info ? <InfoTooltip text={info} label={label} /> : null}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug break-words line-clamp-2">{value}</p>
        {hint ? (
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug line-clamp-2">{hint}</p>
        ) : null}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn('pb-2', variant === 'hero' ? 'p-5 pb-2' : 'p-4 pb-2')}>
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
          {info ? <InfoTooltip text={info} label={label} /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('pt-0', variant === 'hero' ? 'px-5 pb-5' : 'px-4 pb-4')}>
        <p className={cn('font-bold leading-tight break-words', variant === 'hero' ? 'text-2xl' : 'text-xl')}>
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
