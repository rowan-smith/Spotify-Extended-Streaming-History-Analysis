import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InfoTooltip } from '@/components/InfoTooltip';

interface MetricTabsProps {
  active: 'plays' | 'time';
  onChange: (value: 'plays' | 'time') => void;
  playsInfo: string;
  timeInfo: string;
  className?: string;
}

export function MetricTabs({ active, onChange, playsInfo, timeInfo, className }: MetricTabsProps) {
  return (
    <ToggleGroup
      className={cn('w-full sm:w-auto', className)}
      value={[active]}
      onValueChange={(value) => { if (value.length > 0) onChange(value[0] as 'plays' | 'time'); }}
      aria-label="Ranking metric"
    >
      <ToggleGroupItem value="plays" className="h-10 sm:h-9 flex-1 sm:flex-initial rounded-md text-xs">
        Plays
        <InfoTooltip text={playsInfo} label="Plays metric" />
      </ToggleGroupItem>
      <ToggleGroupItem value="time" className="h-10 sm:h-9 flex-1 sm:flex-initial rounded-md text-xs">
        Playtime
        <InfoTooltip text={timeInfo} label="Playtime metric" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
