import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', icon && 'btn-icon', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
