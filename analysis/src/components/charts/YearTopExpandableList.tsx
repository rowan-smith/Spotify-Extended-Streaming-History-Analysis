import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatHours } from '../../utils/formatting';
import type { RankingMetric, SongStats } from '../../types';
import { MobileRankedList, ProgressBar } from './MobileRankedList';
import { songsToRankedItems } from '../../analysis/rankedListBreakdown';
import {
  metricValueForEntry,
  yearTopEntryKey,
  type YearTopEntry,
  type YearTopLabelKey,
} from './yearTopBreakdown';

interface YearTopExpandableListProps {
  entries: YearTopEntry[];
  labelKey: YearTopLabelKey;
  rankingMetric: RankingMetric;
  songBreakdowns: Map<string, SongStats[]>;
}

function breakdownLabelFor(labelKey: YearTopLabelKey): string {
  if (labelKey === 'albumName') return 'Songs on this album';
  if (labelKey === 'artistName') return 'Songs by this artist';
  return 'Songs that year';
}

export function YearTopExpandableList({
  entries,
  labelKey,
  rankingMetric,
  songBreakdowns,
}: YearTopExpandableListProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const breakdownLabel = breakdownLabelFor(labelKey);
  const metricLabel = rankingMetric === 'plays' ? 'Plays' : 'Hours';

  const maxPrimaryValue = Math.max(
    ...entries.map((entry) => metricValueForEntry(entry, rankingMetric)),
    1,
  );

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

  function songToListItem(song: SongStats) {
    return songsToRankedItems([song], rankingMetric, {
      hideArtist: labelKey === 'artistName',
    })[0];
  }

  return (
    <div className="divide-y divide-border" role="list">
      {entries.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-6">No data for this range.</p>
      ) : (
        entries.map((entry) => {
            const key = yearTopEntryKey(entry);
            const songs = songBreakdowns.get(key) ?? [];
            const expanded = expandedKeys.has(key);
            const canExpand = songs.length > 0;
            const primaryValue = metricValueForEntry(entry, rankingMetric);
            const primaryWidth = Math.max(6, (primaryValue / maxPrimaryValue) * 100);

            return (
              <article key={key} className="py-3 first:pt-0 last:pb-0" role="listitem">
                <div className="flex items-start gap-2">
                  {canExpand ? (
                    <button
                      type="button"
                      className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? 'Hide' : 'Show'} ${breakdownLabel.toLowerCase()} for ${entry.name}`}
                      onClick={() => toggleExpanded(key)}
                    >
                      {expanded ? (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <span className="w-7 shrink-0" aria-hidden="true" />
                  )}

                  <span className="flex-shrink-0 inline-grid place-items-center min-w-10 h-6 px-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold tabular-nums">
                    {entry.year}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">{entry.name}</p>
                        {entry.detail ? (
                          <p className="text-xs text-muted-foreground break-words">{entry.detail}</p>
                        ) : null}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold tabular-nums">
                          {rankingMetric === 'plays'
                            ? entry.plays.toLocaleString()
                            : formatHours(entry.hours)}
                        </p>
                        <p className="text-xs text-muted-foreground">{metricLabel}</p>
                      </div>
                    </div>

                    <div className="mt-1.5">
                      <ProgressBar width={primaryWidth} />
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {rankingMetric === 'plays'
                        ? formatHours(entry.hours)
                        : `${entry.plays.toLocaleString()} plays`}
                    </p>
                  </div>
                </div>

                {expanded && canExpand ? (
                  <div className="mt-3 ml-9 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{breakdownLabel}</p>
                    <MobileRankedList
                      compact
                      metricLabel={metricLabel}
                      rankingMetric={rankingMetric}
                      items={songs.map(songToListItem)}
                    />
                  </div>
                ) : null}
              </article>
            );
        })
      )}
    </div>
  );
}
