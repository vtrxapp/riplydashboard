import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon?: 'building' | 'none';
}

export function Dropdown({ value, onChange, options, placeholder, icon = 'none' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

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
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: '100%',
          background: 'var(--color-surface)',
          border: `1.5px solid ${open ? 'var(--color-brand-500)' : 'var(--color-border-strong)'}`,
          borderRadius: 14,
          padding: '0 16px',
          height: 52,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {icon === 'building' && <Icon name="building" size={19} color="var(--color-brand-500)" />}
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            fontSize: 14.5,
            fontWeight: 600,
            color: value ? 'var(--color-text)' : 'var(--color-text-faint)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value || placeholder}
        </span>
        <Icon name="chevronDown" size={18} color="var(--color-text-faint)" />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          className="animate-slide-in"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: 10,
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-popover)',
            overflow: 'hidden',
            maxHeight: 212,
            overflowY: 'auto',
          }}
        >
          {options.map((o, i) => {
            const active = o === value;
            return (
              <button
                key={o}
                role="option"
                aria-selected={active}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  border: 'none',
                  background: active ? 'var(--color-brand-50)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: active ? 700 : 600,
                  color: active ? 'var(--color-brand-500)' : 'var(--color-text)',
                  padding: '13px 16px',
                  borderBottom: i < options.length - 1 ? '1px solid var(--color-divider)' : 'none',
                  textAlign: 'left',
                }}
              >
                <span style={{ flex: 1 }}>{o}</span>
                {active && <Icon name="check" size={16} color="var(--color-brand-500)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
