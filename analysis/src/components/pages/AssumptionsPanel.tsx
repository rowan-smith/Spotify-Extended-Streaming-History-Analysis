import { Card, CardContent } from '@/components/ui/card';
import { ASSUMPTIONS, ASSUMPTIONS_INTRO } from '../../content/assumptions';

interface AssumptionsPanelProps {
  variant?: 'page' | 'panel';
}

export function AssumptionsPanel({ variant = 'page' }: AssumptionsPanelProps) {
  const header = (
    <header className={variant === 'page' ? 'mb-8' : 'mb-4'}>
      {variant === 'page' ? (
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Analysis assumptions</h1>
      ) : (
        <h2 className="text-sm font-semibold mb-1">Analysis assumptions</h2>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{ASSUMPTIONS_INTRO}</p>
    </header>
  );

  const list = (
    <dl className="space-y-3">
      {ASSUMPTIONS.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-4">
            <dt className="text-sm font-semibold mb-1.5">{item.title}</dt>
            <dd className="text-sm text-muted-foreground leading-relaxed">{item.body}</dd>
          </CardContent>
        </Card>
      ))}
    </dl>
  );

  if (variant === 'panel') {
    return (
      <section className="rounded-xl border border-border bg-muted/50 p-4">
        {header}
        {list}
      </section>
    );
  }

  return (
    <>
      {header}
      {list}
    </>
  );
}
