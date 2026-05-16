import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { TooltipProps } from 'recharts'

interface LineConfig {
  key: string
  color: string
  name: string
}

interface LineChartProps {
  data: Record<string, unknown>[]
  lines?: LineConfig[]
  xKey?: string
  height?: number
  formatter?: (value: number) => string
  yTickFormatter?: (value: number) => string
}

function CustomTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label as string}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {formatter ? formatter(p.value as number) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function LineChart({
  data = [],
  lines = [{ key: 'value', color: '#8b5cf6', name: 'Value' }],
  xKey = 'period',
  height = 280,
  formatter,
  yTickFormatter,
}: LineChartProps) {
  if (!data.length) return <div className="empty-state">No data available</div>

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLine data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false} axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false} axisLine={false}
          tickFormatter={yTickFormatter}
          width={60}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {lines.map(({ key, color, name }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </RechartsLine>
    </ResponsiveContainer>
  )
}
