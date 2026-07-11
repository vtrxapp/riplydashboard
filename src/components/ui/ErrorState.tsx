import { Icon } from './Icon';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong while loading this data.', onRetry }: ErrorStateProps) {
  return (
    <div className="state-block" role="alert">
      <div className="state-block-icon" style={{ background: 'var(--color-red-bg)' }}>
        <Icon name="x" size={22} color="var(--color-red)" />
      </div>
      <div className="state-title">Couldn't load this</div>
      <div className="state-desc">{message}</div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} style={{ marginTop: 10 }}>
          Try again
        </Button>
      )}
    </div>
  );
}
