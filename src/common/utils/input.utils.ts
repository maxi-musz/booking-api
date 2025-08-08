export class InputUtils {
  /**
   * Trims whitespace from string inputs
   */
  static trimString(value: string | undefined | null): string | undefined {
    if (value === undefined || value === null) return undefined;
    return typeof value === 'string' ? value.trim() : value;
  }

  /**
   * Trims whitespace from all string properties in an object
   */
  static trimObject<T extends Record<string, any>>(obj: T): T {
    const trimmed = { ...obj };
    for (const key in trimmed) {
      if (typeof trimmed[key] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (trimmed as any)[key] = this.trimString(trimmed[key]);
      }
    }
    return trimmed;
  }

  /**
   * Converts DD-MM-YYYY string to Date object
   */
  static parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  /**
   * Converts Date object to DD-MM-YYYY string
   */
  static formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Validates that a date is in the future
   */
  static isFutureDate(date: Date): boolean {
    return new Date(date) > new Date();
  }

  /**
   * Validates that start date is before end date
   */
  static isValidDateRange(startDate: Date, endDate: Date): boolean {
    return new Date(startDate) < new Date(endDate);
  }

  /**
   * Validates that a number is positive
   */
  static isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0;
  }

  /**
   * Validates DD-MM-YYYY date format
   */
  static isValidDateFormat(dateString: string): boolean {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(dateString)) return false;

    const [day, month, year] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    );
  }

  /**
   * Checks if a string is a non-empty positive string (for IDs)
   */
  static isPositiveString(value: string | undefined | null): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
