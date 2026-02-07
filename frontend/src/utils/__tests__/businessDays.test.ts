import { describe, it, expect } from 'vitest';
import {
  isWeekend,
  isHoliday,
  isBusinessDay,
  addBusinessHours,
  addBusinessDays,
  getDefaultQuoteValidUntil,
  getBusinessDaysBetween,
} from '../businessDays';

describe('businessDays', () => {
  describe('isWeekend', () => {
    it('should identify Saturday as weekend', () => {
      const saturday = new Date('2026-02-07'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should identify Sunday as weekend', () => {
      const sunday = new Date('2026-02-08'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should identify Monday as not weekend', () => {
      const monday = new Date('2026-02-09'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });

    it('should identify Friday as not weekend', () => {
      const friday = new Date('2026-02-06'); // Friday
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('isHoliday', () => {
    it('should identify New Year as holiday', () => {
      const newYear = new Date('2026-01-01');
      expect(isHoliday(newYear)).toBe(true);
    });

    it('should identify Independence Day as holiday', () => {
      const independenceDay = new Date('2026-08-17');
      expect(isHoliday(independenceDay)).toBe(true);
    });

    it('should identify regular day as not holiday', () => {
      const regularDay = new Date('2026-02-10');
      expect(isHoliday(regularDay)).toBe(false);
    });
  });

  describe('isBusinessDay', () => {
    it('should identify weekday as business day', () => {
      const monday = new Date('2026-02-09'); // Monday, not holiday
      expect(isBusinessDay(monday)).toBe(true);
    });

    it('should identify weekend as not business day', () => {
      const saturday = new Date('2026-02-07'); // Saturday
      expect(isBusinessDay(saturday)).toBe(false);
    });

    it('should identify holiday as not business day', () => {
      const holiday = new Date('2026-01-01'); // New Year
      expect(isBusinessDay(holiday)).toBe(false);
    });
  });

  describe('addBusinessHours', () => {
    it('should add 24 hours to a weekday', () => {
      const monday = new Date('2026-02-09T10:00:00'); // Monday 10:00
      const result = addBusinessHours(monday, 24);
      
      // Should be Tuesday 10:00
      expect(result.getDate()).toBe(10);
      expect(result.getDay()).toBe(2); // Tuesday
    });

    it('should skip weekend when adding 24 hours from Friday', () => {
      const friday = new Date('2026-02-06T10:00:00'); // Friday 10:00
      const result = addBusinessHours(friday, 24);
      
      // Should be Monday (skip Saturday and Sunday)
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(9);
    });

    it('should skip holiday when adding business hours', () => {
      const beforeHoliday = new Date('2025-12-31T10:00:00'); // Day before New Year
      const result = addBusinessHours(beforeHoliday, 24);
      
      // Should skip Jan 1 (New Year) and land on Jan 2
      expect(result.getDate()).toBe(2);
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('addBusinessDays', () => {
    it('should add 1 business day', () => {
      const monday = new Date('2026-02-09'); // Monday
      const result = addBusinessDays(monday, 1);
      
      // Should be Tuesday
      expect(result.getDay()).toBe(2);
      expect(result.getDate()).toBe(10);
    });

    it('should add 5 business days (1 week)', () => {
      const monday = new Date('2026-02-09'); // Monday
      const result = addBusinessDays(monday, 5);
      
      // Should be next Monday (skip weekend)
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(16);
    });
  });

  describe('getDefaultQuoteValidUntil', () => {
    it('should return a date in the future', () => {
      const result = getDefaultQuoteValidUntil();
      const now = new Date();
      
      expect(result.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return a business day', () => {
      const result = getDefaultQuoteValidUntil();
      
      // Result should be a business day (not weekend, not holiday)
      expect(isBusinessDay(result)).toBe(true);
    });
  });

  describe('getBusinessDaysBetween', () => {
    it('should count business days between two dates', () => {
      const start = new Date('2026-02-09'); // Monday
      const end = new Date('2026-02-13'); // Friday
      
      // Monday to Friday = 4 business days (Mon, Tue, Wed, Thu)
      expect(getBusinessDaysBetween(start, end)).toBe(4);
    });

    it('should exclude weekends from count', () => {
      const start = new Date('2026-02-06'); // Friday
      const end = new Date('2026-02-10'); // Tuesday
      
      // Friday to Tuesday = 2 business days (Fri, Mon)
      expect(getBusinessDaysBetween(start, end)).toBe(2);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2026-02-09');
      expect(getBusinessDaysBetween(date, date)).toBe(0);
    });
  });
});
