import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card-header-row">
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
