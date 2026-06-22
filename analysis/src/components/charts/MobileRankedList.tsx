interface MobileRankedListItem {
  primary: string;
  secondary?: string;
  value: number;
  valueText: string;
  meta?: string;
}

interface MobileRankedListProps {
  items: MobileRankedListItem[];
  metricLabel: string;
}

export function MobileRankedList({ items, metricLabel }: MobileRankedListProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="divide-y divide-border" role="list">
      {items.map((item, index) => {
        const width = Math.max(6, (item.value / maxValue) * 100);

        return (
          <article
            key={`${item.primary}-${item.secondary ?? index}`}
            className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            role="listitem"
          >
            <span className="flex-shrink-0 inline-grid place-items-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold">
              {index + 1}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" title={item.primary}>
                    {item.primary}
                  </p>
                  {item.secondary ? (
                    <p className="text-xs text-muted-foreground truncate" title={item.secondary}>
                      {item.secondary}
                    </p>
                  ) : null}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{item.valueText}</p>
                  <p className="text-xs text-muted-foreground">{metricLabel}</p>
                </div>
              </div>

              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${width}%` }} />
              </div>

              {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
