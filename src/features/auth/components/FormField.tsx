import type { ReactNode } from 'react';

export function FormField({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {error && (
        <div role="alert" style={{ fontSize: 12.5, color: 'var(--color-red)', marginTop: 6, fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
}
