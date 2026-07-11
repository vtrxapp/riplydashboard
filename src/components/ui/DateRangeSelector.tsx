import { DATE_RANGES } from '@/utils/constants';
import type { DateRangeId } from '@/types/analytics';

interface DateRangeSelectorProps {
  value: DateRangeId;
  onChange: (value: DateRangeId) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Date range"
      style={{
        display: 'flex',
        gap: 4,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border-strong)',
        borderRadius: 13,
        padding: 4,
      }}
    >
      {DATE_RANGES.map((r) => (
        <button
          key={r.id}
          type="button"
          aria-pressed={r.id === value}
          onClick={() => onChange(r.id as DateRangeId)}
          style={{
            border: 'none',
            borderRadius: 9,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13.5,
            fontWeight: 700,
            padding: '8px 13px',
            background: r.id === value ? 'var(--color-brand-500)' : 'none',
            color: r.id === value ? '#fff' : 'var(--color-text-muted)',
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
