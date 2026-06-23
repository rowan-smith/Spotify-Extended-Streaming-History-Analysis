import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RankingMetric, SongStats } from '../../types';
import { songsToRankedItems } from '../../analysis/rankedListBreakdown';

export interface MobileRankedListItem {
  primary: string;
  secondary?: string;
  value: number;
  valueText: string;
  meta?: string;
  badge?: string;
  rowKey?: string;
  breakdown?: SongStats[];
  breakdownLabel?: string;
  hideArtistInBreakdown?: boolean;
}

interface MobileRankedListProps {
  items: MobileRankedListItem[];
  metricLabel: string;
  rankingMetric?: RankingMetric;
  startRank?: number;
  compact?: boolean;
}

function ProgressBar({ width }: { width: number }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function RankedListRow({
  item,
  rank,
  metricLabel,
  maxValue,
  compact,
  expanded,
  canExpand,
  onToggleExpand,
  rankingMetric = 'plays',
}: {
  item: MobileRankedListItem;
  rank: number;
  metricLabel: string;
  maxValue: number;
  compact?: boolean;
  expanded?: boolean;
  canExpand?: boolean;
  onToggleExpand?: () => void;
  rankingMetric?: RankingMetric;
}) {
  const width = Math.max(6, (item.value / maxValue) * 100);
  const badge = item.badge ?? String(rank);
  const breakdownLabel = item.breakdownLabel ?? 'Songs';

  return (
    <article className={compact ? 'py-2' : 'py-3 first:pt-0 last:pb-0'} role="listitem">
      <div className="flex items-start gap-2">
        {canExpand ? (
          <button
            type="button"
            className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer shrink-0"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} ${breakdownLabel.toLowerCase()} for ${item.primary}`}
            onClick={onToggleExpand}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        ) : compact ? null : (
          <span className="w-7 shrink-0" aria-hidden="true" />
        )}

        <span className="flex-shrink-0 inline-grid place-items-center min-w-6 h-6 px-1 rounded-full bg-accent/20 text-accent text-xs font-bold">
          {badge}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium break-words" title={item.primary}>
                {item.primary}
              </p>
              {item.secondary ? (
                <p className="text-xs text-muted-foreground break-words" title={item.secondary}>
                  {item.secondary}
                </p>
              ) : null}
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold tabular-nums">{item.valueText}</p>
              <p className="text-xs text-muted-foreground">{metricLabel}</p>
            </div>
          </div>

          <div className="mt-1.5">
            <ProgressBar width={width} />
          </div>

          {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
        </div>
      </div>

      {expanded && canExpand && item.breakdown ? (
        <div className={`mt-3 rounded-lg border border-border bg-muted/30 p-3 ${compact ? '' : 'ml-9'}`}>
          <p className="text-xs font-medium text-muted-foreground mb-2">{breakdownLabel}</p>
          <MobileRankedList
            compact
            metricLabel={metricLabel}
            rankingMetric={rankingMetric}
            items={songsToRankedItems(item.breakdown, rankingMetric, {
              hideArtist: item.hideArtistInBreakdown,
            })}
          />
        </div>
      ) : null}
    </article>
  );
}

export function MobileRankedList({
  items,
  metricLabel,
  rankingMetric = 'plays',
  startRank = 1,
  compact = false,
}: MobileRankedListProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  function itemKey(item: MobileRankedListItem, index: number) {
    return item.rowKey ?? `${item.primary}\0${item.secondary ?? ''}\0${index}`;
  }

  function toggleExpanded(key: string) {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className={compact ? 'space-y-2' : 'divide-y divide-border'} role="list">
      {items.map((item, index) => {
        const key = itemKey(item, index);
        const canExpand = (item.breakdown?.length ?? 0) > 0;

        return (
          <RankedListRow
            key={key}
            item={item}
            rank={startRank + index}
            metricLabel={metricLabel}
            maxValue={maxValue}
            compact={compact}
            canExpand={canExpand}
            expanded={expandedKeys.has(key)}
            onToggleExpand={canExpand ? () => toggleExpanded(key) : undefined}
            rankingMetric={rankingMetric}
          />
        );
      })}
    </div>
  );
}

export { ProgressBar };
