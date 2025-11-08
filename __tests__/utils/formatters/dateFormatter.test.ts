import {
  formatFullDate,
  formatTime,
  formatDateMMDD,
  formatDateMMDDYY,
} from '../../../src/utils/formatters/dateFormatter';

describe('utils/formatters/dateFormatter', () => {
  const validDate = '2025-10-19T14:30:00Z';
  const invalidDate = 'not a real date';

  // Test suite for formatFullDate
  describe('formatFullDate', () => {
    it('should return "Invalid Date" for an invalid date string', () => {
      expect(formatFullDate(invalidDate)).toBe('Invalid Date');
    });

    it('should return a fully formatted date string for a valid ISO string', () => {
      // Note: toLocaleDateString can be locale-dependent.
      // This test assumes an 'en-US' runtime, which Jest typically uses.
      expect(formatFullDate(validDate)).toBe('Sunday, October 19, 2025');
    });
  });

  // Test suite for formatTime
  describe('formatTime', () => {
    it('should return an empty string for an invalid date', () => {
      expect(formatTime(invalidDate)).toBe('');
    });

    it('should return a correctly formatted time with AM/PM', () => {
      // '14:30:00Z' is 2:30 PM UTC.
      // The output will be in the test runner's local timezone (e.g., PST, EST).
      // Let's create a date that is 2:30 PM *locally* to make the test stable.
      const localDate = new Date();
      localDate.setHours(14, 30, 0, 0); // 2:30 PM local
      expect(formatTime(localDate.toISOString())).toBe('2:30 PM');
    });
  });

  // Test suite for formatDateMMDD
  describe('formatDateMMDD', () => {
    it('should return "Oct 19"', () => {
      expect(formatDateMMDD(validDate)).toBe('Oct 19');
    });
  });

  // Test suite for formatDateMMDDYY
  describe('formatDateMMDDYY', () => {
    it('should return "Oct 19, 2025"', () => {
      expect(formatDateMMDDYY(validDate)).toBe('Oct 19, 2025');
    });
  });
});