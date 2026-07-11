interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style, className }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className ?? ''}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width={40} height={40} radius={12} />
        <Skeleton width={54} height={24} radius={999} />
      </div>
      <div style={{ marginTop: 14 }}>
        <Skeleton width={90} height={28} />
      </div>
      <div style={{ marginTop: 8 }}>
        <Skeleton width={120} height={14} />
      </div>
      <div style={{ marginTop: 12 }}>
        <Skeleton height={38} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton height={16} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="card" aria-hidden="true">
      <Skeleton width={160} height={18} />
      <Skeleton width={220} height={13} style={{ marginTop: 8 }} />
      <Skeleton height={height} style={{ marginTop: 18 }} />
    </div>
  );
}
