import type { ReactElement } from 'react';
import type { ThemePreference } from '../hooks/useTheme';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ThemeToggleProps {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9" />
      <path d="M2 17h20" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

const OPTIONS: { value: ThemePreference; label: string; Icon: () => ReactElement }[] = [
  { value: 'system', label: 'Use system theme', Icon: SystemIcon },
  { value: 'light', label: 'Light theme', Icon: SunIcon },
  { value: 'dark', label: 'Dark theme', Icon: MoonIcon },
];

export function ThemeToggle({ preference, onChange }: ThemeToggleProps) {
  return (
    <ToggleGroup
      value={[preference]}
      onValueChange={(value) => {
        if (value.length > 0) onChange(value[0] as ThemePreference);
      }}
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="p-2 sm:p-1.5 rounded-md"
        >
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
