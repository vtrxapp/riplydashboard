import { useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordInput({ id, value, onChange, placeholder, autoComplete }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="input-row">
      <Icon name="lock" size={19} color="var(--color-text-faint)" />
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{ border: 'none', background: 'none', padding: 0, display: 'flex', flexShrink: 0 }}
      >
        <Icon name={show ? 'eye' : 'eyeOff'} size={19} color="var(--color-text-faint)" />
      </button>
    </div>
  );
}
