export function formatLocalDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatLocalDate(date: Date): string {
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSessionLength(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (minutes < 60) {
    return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

export function formatHourLabelLocal(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    hour12: true,
  });
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'long' });
}
