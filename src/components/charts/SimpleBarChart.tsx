import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ChartEmpty } from './ChartStates';

export interface BarPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarPoint[];
  color?: string;
  highlightColor?: string;
  height?: number;
  ariaLabel: string;
  tickInterval?: number;
}

/** Single-series bar chart — Active Hours, Events/Hour volume. */
export function SimpleBarChart({
  data,
  color = '#CFE6FB',
  highlightColor = '#0098F0',
  height = 190,
  ariaLabel,
  tickInterval,
}: SimpleBarChartProps) {
  if (!data || data.every((d) => d.value === 0)) return <ChartEmpty height={height} />;

  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-faint)', fontFamily: 'Montserrat' }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-alt)' }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12.5,
              fontFamily: 'Montserrat',
            }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === maxIdx ? highlightColor : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
