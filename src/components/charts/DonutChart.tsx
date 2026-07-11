import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ChartEmpty } from './ChartStates';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}

export function DonutChart({ data, centerValue, centerLabel, size = 160 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <ChartEmpty height={size} message="No data yet" />;

  return (
    <div style={{ position: 'relative', width: size, height: size }} role="img" aria-label={`${centerLabel}: ${centerValue}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={size * 0.37}
            outerRadius={size * 0.5}
            paddingAngle={data.length > 1 ? 2 : 0}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: size * 0.2, fontWeight: 800, color: 'var(--color-text)' }}>{centerValue}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)' }}>{centerLabel}</span>
      </div>
    </div>
  );
}

export function DonutLegend({ data }: { data: DonutSlice[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: d.color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{d.label}</span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
