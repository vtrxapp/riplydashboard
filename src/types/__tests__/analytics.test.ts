import { describe, expect, it } from 'vitest';
import { granularityForRange, resolveDateRange } from '../analytics';

describe('resolveDateRange', () => {
  const now = new Date('2026-07-10T00:00:00.000Z');

  it('resolves 7d to a 7-day window', () => {
    const { from, to } = resolveDateRange('7d', now);
    expect(to).toEqual(now);
    expect(from.toISOString()).toBe('2026-07-03T00:00:00.000Z');
  });

  it('resolves 30d to a 30-day window', () => {
    const { from } = resolveDateRange('30d', now);
    expect(from.toISOString()).toBe('2026-06-10T00:00:00.000Z');
  });

  it('resolves 1y to a 1-year window', () => {
    const { from } = resolveDateRange('1y', now);
    expect(from.toISOString()).toBe('2025-07-10T00:00:00.000Z');
  });
});

describe('granularityForRange', () => {
  it('uses day granularity for 7d', () => {
    expect(granularityForRange('7d')).toBe('day');
  });

  it('uses week granularity for 30d and 90d', () => {
    expect(granularityForRange('30d')).toBe('week');
    expect(granularityForRange('90d')).toBe('week');
  });

  it('uses month granularity for 1y', () => {
    expect(granularityForRange('1y')).toBe('month');
  });
});
