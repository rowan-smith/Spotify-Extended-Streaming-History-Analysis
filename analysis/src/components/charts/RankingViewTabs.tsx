import { cn } from '@/lib/utils';
import { RANKING_VIEW_INFO } from '../../content/siteContent';
import type { RankingViewMode } from '../../types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InfoTooltip } from '../InfoTooltip';

interface RankingViewTabsProps {
  active: RankingViewMode;
  onChange: (value: RankingViewMode) => void;
  className?: string;
}

export function RankingViewTabs({ active, onChange, className }: RankingViewTabsProps) {
  return (
    <ToggleGroup
      className={cn('w-full sm:w-auto', className)}
      value={[active]}
      onValueChange={(value) => {
        if (value.length > 0) onChange(value[0] as RankingViewMode);
      }}
      aria-label="Ranking view"
    >
      <ToggleGroupItem value="standard" className="flex-1 sm:flex-initial h-10 sm:h-9">
        Standard
        <InfoTooltip text={RANKING_VIEW_INFO.standard} label="Standard ranking view" />
      </ToggleGroupItem>
      <ToggleGroupItem value="wrapped" className="flex-1 sm:flex-initial h-10 sm:h-9">
        Wrapped
        <InfoTooltip text={RANKING_VIEW_INFO.wrapped} label="Wrapped ranking view" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
