import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewModeToggle } from './ViewModeToggle';
import { ALL_VIEW_MODES, type ViewMode } from './viewMode';

interface ChartViewToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
  showChartReset?: boolean;
  onChartReset?: () => void;
}

export function ChartViewToolbar({
  viewMode,
  onViewModeChange,
  modes = ALL_VIEW_MODES,
  showChartReset = false,
  onChartReset,
}: ChartViewToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {showChartReset ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-md"
          aria-label="Reset chart zoom"
          title="Reset chart zoom"
          onClick={onChartReset}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
      <ViewModeToggle value={viewMode} onChange={onViewModeChange} modes={modes} />
    </div>
  );
}
