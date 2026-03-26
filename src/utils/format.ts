/**
 * Format a time string like "0900" or "09:00" to "09:00"
 */
export function formatTime(time?: string | null): string {
  if (!time) return '—';
  // Already has colon
  if (time.includes(':')) return time;
  // Format "0900" -> "09:00"
  if (time.length === 4) return `${time.slice(0, 2)}:${time.slice(2)}`;
  return time;
}

/**
 * Format a date string consistently regardless of locale
 */
export function formatDate(dateStr?: string | null, options?: { short?: boolean; weekday?: boolean }): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = options?.short ? months[date.getMonth()] : fullMonths[date.getMonth()];
  const year = date.getFullYear();

  if (options?.weekday) {
    return `${weekdays[date.getDay()]}, ${day} ${month} ${year}`;
  }
  if (options?.short) {
    return `${day} ${months[date.getMonth()]}`;
  }
  return `${day} ${month} ${year}`;
}

/**
 * Format a timestamp to a readable date+time
 */
export function formatDateTime(timestamp?: number | null): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return `${formatDate(date.toISOString().split('T')[0])} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Format currency amount (in cents)
 */
export function formatMoney(cents: number, currency = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
  return `${symbol}${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}
