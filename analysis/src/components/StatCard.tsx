import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  info?: string;
  variant?: 'default' | 'hero';
}

export function StatCard({ label, value, hint, info, variant = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-1.5">
          {label}
          {info ? <InfoTooltip text={info} label={label} /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className={cn('text-2xl font-bold leading-tight break-words', variant === 'hero' && 'text-3xl')}>
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
