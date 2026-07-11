/** Compact number formatting: 12840 -> "12.8K", 940 -> "940". */
export function formatCompactNumber(n: number | null | undefined): string {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(v));
}

/** Percent change from `prev` to `current`, or null if there's no meaningful baseline. */
export function percentDelta(current: number, prev: number): number | null {
  if (!prev) return current > 0 ? 100 : null;
  return ((current - prev) / prev) * 100;
}

export function formatPercent(pct: number | null, digits = 1): string {
  if (pct == null) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(digits)}%`;
}

export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', opts);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return '—';
  const diffMs = Date.now() - d;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value, { month: 'short', year: 'numeric' });
}

export function initialOf(value?: string | null): string {
  return value?.trim()?.charAt(0)?.toUpperCase() || '?';
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
