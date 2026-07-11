export function FullscreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        height: '100vh',
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-text-muted)',
        background: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-brand-500)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
    </div>
  );
}
