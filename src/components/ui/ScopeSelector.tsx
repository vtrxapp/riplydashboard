import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import type { Scope } from '@/stores/uiStore';

const OPTIONS: { id: Scope; label: string }[] = [
  { id: 'mine', label: 'My events' },
  { id: 'campus', label: 'Campus-wide' },
];

interface ScopeSelectorProps {
  value: Scope;
  onChange: (value: Scope) => void;
}

export function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = OPTIONS.find((o) => o.id === value)?.label ?? 'Campus-wide';

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          height: 42,
          padding: '0 15px',
          border: '1.5px solid var(--color-border-strong)',
          borderRadius: 13,
          background: 'var(--color-surface)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--color-text)',
        }}
      >
        <Icon name="building" size={17} color="var(--color-brand-500)" />
        <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
        <Icon name="chevronDown" size={16} color="var(--color-text-faint)" />
      </button>
      {open && (
        <div
          role="listbox"
          className="animate-slide-in"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: 20,
            background: 'var(--color-surface)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-popover)',
            overflow: 'hidden',
            width: 200,
          }}
        >
          {OPTIONS.map((o, i) => (
            <button
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: o.id === value ? 'var(--color-brand-50)' : 'var(--color-surface)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14.5,
                fontWeight: o.id === value ? 800 : 600,
                color: o.id === value ? 'var(--color-brand-500)' : 'var(--color-text)',
                padding: '13px 16px',
                borderBottom: i < OPTIONS.length - 1 ? '1px solid var(--color-divider)' : 'none',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
