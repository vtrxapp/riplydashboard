import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartEmpty } from './ChartStates';

export interface DualSeriesPoint {
  label: string;
  a: number;
  b: number;
}

interface DualAreaChartProps {
  data: DualSeriesPoint[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
  height?: number;
}

/** Two overlaid area/line series sharing an x-axis — Engagement Trend, Member Growth. */
export function DualAreaChart({
  data,
  aLabel,
  bLabel,
  aColor = '#0098F0',
  bColor = '#FFB020',
  height = 230,
}: DualAreaChartProps) {
  if (!data || data.length === 0) return <ChartEmpty height={height} />;

  return (
    <div role="img" aria-label={`${aLabel} vs ${bLabel} over time`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="dualA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={aColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={aColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dualB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bColor} stopOpacity={0.16} />
              <stop offset="100%" stopColor={bColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-divider)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-text-faint)', fontFamily: 'Montserrat' }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12.5,
              fontFamily: 'Montserrat',
            }}
          />
          <Area type="monotone" dataKey="b" name={bLabel} stroke={bColor} fill="url(#dualB)" strokeWidth={2.5} isAnimationActive={false} />
          <Area type="monotone" dataKey="a" name={aLabel} stroke={aColor} fill="url(#dualA)" strokeWidth={2.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
