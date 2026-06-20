interface InfoTooltipProps {
  text: string;
  label?: string;
}

export function InfoTooltip({ text, label = 'More information' }: InfoTooltipProps) {
  return (
    <span
      className="info-tooltip"
      tabIndex={0}
      role="note"
      aria-label={label}
      data-tooltip={text}
    >
      i
    </span>
  );
}
