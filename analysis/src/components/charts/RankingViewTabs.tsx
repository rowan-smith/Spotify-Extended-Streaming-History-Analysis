import { RANKING_VIEW_INFO } from '../../content/siteContent';
import type { RankingViewMode } from '../../types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InfoTooltip } from '../InfoTooltip';

interface RankingViewTabsProps {
  active: RankingViewMode;
  onChange: (value: RankingViewMode) => void;
}

export function RankingViewTabs({ active, onChange }: RankingViewTabsProps) {
  return (
    <ToggleGroup
      value={[active]}
      onValueChange={(value) => {
        if (value.length > 0) onChange(value[0] as RankingViewMode);
      }}
      aria-label="Ranking view"
    >
      <ToggleGroupItem value="standard">
        Standard
        <InfoTooltip text={RANKING_VIEW_INFO.standard} label="Standard ranking view" />
      </ToggleGroupItem>
      <ToggleGroupItem value="wrapped">
        Wrapped
        <InfoTooltip text={RANKING_VIEW_INFO.wrapped} label="Wrapped ranking view" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
