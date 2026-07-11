import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { formatCompactNumber, formatPercent } from '@/utils/format';

interface DeltaBadgeProps {
  deltaPct: number | null;
}

export function DeltaBadge({ deltaPct }: DeltaBadgeProps) {
  if (deltaPct == null) {
    return (
      <div className="badge" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-faint)' }}>
        —
      </div>
    );
  }
  const positive = deltaPct >= 0;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        height: 24,
        padding: '0 9px',
        borderRadius: 999,
        background: positive ? 'var(--color-green-bg)' : 'var(--color-red-bg)',
      }}
    >
      <Icon name={positive ? 'up' : 'down'} size={11} color={positive ? 'var(--color-green)' : 'var(--color-red)'} strokeWidth={3} />
      <span style={{ fontSize: 13, fontWeight: 800, color: positive ? 'var(--color-green)' : 'var(--color-red)' }}>
        {formatPercent(deltaPct)}
      </span>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number | string;
  deltaPct?: number | null;
  iconName: IconName;
  iconBg: string;
  iconColor: string;
  spark?: ReactNode;
  compact?: boolean;
}

export function KpiCard({ label, value, deltaPct, iconName, iconBg, iconColor, spark, compact }: KpiCardProps) {
  const displayValue = typeof value === 'number' ? formatCompactNumber(value) : value;
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={iconName} size={20} color={iconColor} />
        </div>
        {!compact && <DeltaBadge deltaPct={deltaPct ?? null} />}
      </div>
      <div style={{ fontSize: 29, fontWeight: 800, letterSpacing: -1, marginTop: 14 }}>{displayValue}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>
      {spark && <div style={{ marginTop: 12 }}>{spark}</div>}
    </div>
  );
}
