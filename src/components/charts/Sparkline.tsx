import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  points: number[];
  color: string;
}

/** Tiny trend indicator used inside KPI cards. */
export function Sparkline({ points, color }: SparklineProps) {
  if (!points || points.length < 2) return null;
  const data = points.map((v, i) => ({ i, v }));
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div style={{ height: 38 }} role="img" aria-label="Trend sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
