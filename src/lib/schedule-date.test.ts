import { describe, expect, it } from 'vitest';
import { localDateString, scheduleDate } from './schedule-date';

describe('scheduleDate', () => {
  it('reads a shareable date, including leap days', () => {
    expect(scheduleDate('2026-06-15')).toBe('2026-06-15');
    expect(scheduleDate('2024-02-29')).toBe('2024-02-29');
  });

  it('falls back for missing, malformed, or impossible dates', () => {
    for (const value of [undefined, null, '', 'today', '2026-2-01', '2026-02-29', '2026-04-31', '2026-13-01', ['2026-06-15']]) {
      expect(scheduleDate(value, '2026-06-16')).toBe('2026-06-16');
    }
  });

  it('formats local dates with zero padding', () => {
    expect(localDateString(new Date(2026, 0, 2))).toBe('2026-01-02');
  });
});
