import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RankingMetric } from '../../types';
import { MobileRankedList, type MobileRankedListItem } from './MobileRankedList';

interface FancyRankedListPanelProps {
  items: MobileRankedListItem[];
  metricLabel: string;
  rankingMetric?: RankingMetric;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  filterItem?: (item: MobileRankedListItem, query: string) => boolean;
}

export function FancyRankedListPanel({
  items,
  metricLabel,
  rankingMetric = 'plays',
  searchPlaceholder = 'Filter rows…',
  pageSize = 25,
  emptyMessage = 'No rows match your filters.',
  filterItem,
}: FancyRankedListPanelProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      if (filterItem) return filterItem(item, normalized);

      const haystack = [item.primary, item.secondary ?? '', item.meta ?? '', item.valueText]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [filterItem, items, query]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filteredItems.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <Input
          type="search"
          className="max-w-sm"
          value={query}
          placeholder={searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {filteredItems.length.toLocaleString()} row{filteredItems.length === 1 ? '' : 's'}
        </p>
      </div>

      {pageItems.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-6">{emptyMessage}</p>
      ) : (
        <MobileRankedList
          items={pageItems}
          metricLabel={metricLabel}
          rankingMetric={rankingMetric}
          startRank={currentPage * pageSize + 1}
        />
      )}

      {filteredItems.length > pageSize ? (
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
