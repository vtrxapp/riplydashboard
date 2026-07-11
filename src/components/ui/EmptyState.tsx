import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon = 'search', action }: EmptyStateProps) {
  return (
    <div className="state-block" role="status">
      <div className="state-block-icon">
        <Icon name={icon} size={24} color="var(--color-text-faint)" />
      </div>
      <div className="state-title">{title}</div>
      {description && <div className="state-desc">{description}</div>}
      {action}
    </div>
  );
}
