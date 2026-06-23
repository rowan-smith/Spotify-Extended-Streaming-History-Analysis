import { BarChart3, LayoutGrid } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ALL_VIEW_MODES, type ViewMode } from './viewMode';

const VIEW_MODE_OPTIONS: {
  value: ViewMode;
  label: string;
  Icon: typeof BarChart3;
}[] = [
  { value: 'chart', label: 'Chart view', Icon: BarChart3 },
  { value: 'table', label: 'Table view', Icon: LayoutGrid },
];

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  modes?: ViewMode[];
}

export function ViewModeToggle({
  value,
  onChange,
  modes = ALL_VIEW_MODES,
}: ViewModeToggleProps) {
  const options = VIEW_MODE_OPTIONS.filter((option) => modes.includes(option.value));

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        if (next.length > 0) onChange(next[0] as ViewMode);
      }}
      aria-label="Visualization view"
    >
      {options.map(({ value: optionValue, label, Icon }) => (
        <ToggleGroupItem
          key={optionValue}
          value={optionValue}
          aria-label={label}
          className="p-2 sm:p-1.5 rounded-md"
        >
          <Icon className="size-4" aria-hidden="true" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
