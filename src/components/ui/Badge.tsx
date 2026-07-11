import type { ReactNode } from 'react';

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  green: { bg: 'var(--color-green-bg)', color: 'var(--color-green)' },
  blue: { bg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
  violet: { bg: 'var(--color-violet-bg)', color: 'var(--color-violet)' },
  amber: { bg: 'var(--color-amber-bg)', color: '#d9890b' },
  red: { bg: 'var(--color-red-bg)', color: 'var(--color-red)' },
  neutral: { bg: 'var(--color-surface-muted)', color: 'var(--color-text-faint)' },
};

export type BadgeTone = keyof typeof TONE_STYLES;

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const s = TONE_STYLES[tone] || TONE_STYLES.neutral;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {children}
    </span>
  );
}
