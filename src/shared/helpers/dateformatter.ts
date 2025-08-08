/**
 * Formats a date-like value into a human-readable string.
 *
 * Defaults to: 'D MMMM, YYYY' (e.g., '13 July, 2025') in 'en-US'.
 * Accepts Date, ISO string, timestamp (ms), or DD-MM-YYYY string.
 *
 * Example:
 *  formatDate(new Date()) -> '13 July, 2025'
 *  formatDate('2025-07-13', { locale: 'en-GB' }) -> '13 July 2025'
 */
export function formatDate(
  input: Date | string | number | null | undefined,
  options?: {
    locale?: string;
    timeZone?: string;
    includeWeekday?: boolean;
    fallback?: string | null;
  },
): string | null {
  if (input === null || input === undefined) return options?.fallback ?? null;

  // Normalize to Date
  let date: Date | null = null;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'number') {
    date = new Date(input);
  } else if (typeof input === 'string') {
    // Try native parse first
    const native = new Date(input);
    if (!Number.isNaN(native.getTime())) {
      date = native;
    } else {
      // Try DD-MM-YYYY
      const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
      const match = ddmmyyyy.exec(input);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        date = new Date(year, month - 1, day);
      }
    }
  }

  if (!date || Number.isNaN(date.getTime())) {
    return options?.fallback ?? null;
  }

  const locale = options?.locale ?? 'en-US';
  const base: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  if (options?.includeWeekday) base.weekday = 'long';
  if (options?.timeZone) base.timeZone = options.timeZone;

  return new Intl.DateTimeFormat(locale, base).format(date);
}


