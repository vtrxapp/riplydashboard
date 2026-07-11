import { describe, expect, it } from 'vitest';
import { formatCompactNumber, formatPercent, percentDelta } from '../format';

describe('formatCompactNumber', () => {
  it('formats numbers under 1000 as-is', () => {
    expect(formatCompactNumber(42)).toBe('42');
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(null)).toBe('0');
  });

  it('formats thousands with a K suffix', () => {
    expect(formatCompactNumber(12840)).toBe('12.8K');
    expect(formatCompactNumber(1000)).toBe('1K');
  });

  it('formats millions with an M suffix', () => {
    expect(formatCompactNumber(2_500_000)).toBe('2.5M');
  });
});

describe('percentDelta', () => {
  it('returns null when there is no meaningful previous baseline and current is also zero', () => {
    expect(percentDelta(0, 0)).toBeNull();
  });

  it('returns 100 when going from zero to a positive value', () => {
    expect(percentDelta(10, 0)).toBe(100);
  });

  it('computes standard percentage change', () => {
    expect(percentDelta(150, 100)).toBe(50);
    expect(percentDelta(50, 100)).toBe(-50);
  });
});

describe('formatPercent', () => {
  it('renders an em dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('adds a plus sign for positive deltas', () => {
    expect(formatPercent(12.34)).toBe('+12.3%');
  });

  it('does not add a plus sign for negative deltas', () => {
    expect(formatPercent(-5)).toBe('-5.0%');
  });
});
