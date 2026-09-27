/**
 * Utility functions for formatting order date and timestamp display across the app.
 */

export function formatOrderTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatOrderDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getRelativeTimeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const elapsedMs = Math.max(0, Date.now() - date.getTime());
  const elapsedSecs = Math.floor(elapsedMs / 1000);
  const elapsedMins = Math.floor(elapsedSecs / 60);
  const elapsedHours = Math.floor(elapsedMins / 60);

  if (elapsedMins < 1) {
    return 'Just now';
  } else if (elapsedMins < 60) {
    return `${elapsedMins} ${elapsedMins === 1 ? 'min' : 'mins'} ago`;
  } else {
    return `${elapsedHours} ${elapsedHours === 1 ? 'hr' : 'hrs'} ago`;
  }
}

export function getOrderTimestampSummary(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const timeStr = formatOrderTime(dateInput);
  const relativeStr = getRelativeTimeAgo(dateInput);
  return timeStr ? `${timeStr} (${relativeStr})` : relativeStr;
}
