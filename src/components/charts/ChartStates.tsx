export function ChartSkeleton({ height = 210 }: { height?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: 12 }} aria-hidden="true" />;
}

export function ChartEmpty({ height = 210, message = 'No data yet for this period.' }: { height?: number; message?: string }) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-faint)',
        fontSize: 13.5,
        fontWeight: 600,
        background: 'var(--color-surface-alt)',
        borderRadius: 12,
      }}
      role="status"
    >
      {message}
    </div>
  );
}
