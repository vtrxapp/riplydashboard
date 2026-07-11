import { Icon } from './Icon';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', ariaLabel }: SearchInputProps) {
  return (
    <label className="search-input">
      <Icon name="search" size={17} color="var(--color-text-faint)" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </label>
  );
}
