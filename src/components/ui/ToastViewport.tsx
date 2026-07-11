import { useUiStore } from '@/stores/uiStore';
import { Icon } from './Icon';

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <button
          key={t.id}
          className={`toast ${t.tone === 'error' ? 'toast-error' : ''}`}
          onClick={() => dismissToast(t.id)}
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <Icon name={t.tone === 'error' ? 'x' : 'checkCircle'} size={18} color="#19bfff" />
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
