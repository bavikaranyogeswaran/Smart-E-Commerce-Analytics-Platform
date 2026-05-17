import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import type { TooltipProps } from 'recharts'

const COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#a78bfa','#34d399','#fbbf24']

interface BarConfig { key: string; name: string; color?: string }

interface BarChartProps {
  data: Record<string, unknown>[]
  bars?: BarConfig[]
  xKey?: string
  height?: number
  layout?: 'vertical' | 'horizontal'
  formatter?: (v: number) => string
  colorize?: boolean
}

interface DonutChartProps {
  data: Record<string, unknown>[]
  nameKey?: string
  valueKey?: string
  height?: number
}

function CustomTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label as string}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: (p.fill ?? p.color) as string, fontWeight: 600 }}>
          {p.name}: {formatter ? formatter(p.value as number) : Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function BarChart({
  data = [], bars = [{ key: 'value', name: 'Value' }],
  xKey = 'name', height = 280, layout = 'vertical',
  formatter, colorize = false,
}: BarChartProps) {
  if (!data.length) return <div className="empty-state">No data available</div>
  const isVertical = layout === 'vertical'
  // Recharts' `layout` prop is the inverse of what our prop name suggests:
  //   our `vertical` (bars rise vertically) → Recharts `horizontal`
  //   our `horizontal` (bars extend sideways) → Recharts `vertical`
  // Without this mapping, axis types don't match the chart layout and numeric
  // domain collapses to [0, 1], so bars never render.
  const rechartsLayout = isVertical ? 'horizontal' : 'vertical'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar data={data} layout={rechartsLayout} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"
          horizontal={!isVertical} vertical={isVertical} />
        {isVertical ? (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} type="category" />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} type="number" tickFormatter={v => formatter ? formatter(v as number) : String(v)} />
          </>
        ) : (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => formatter ? formatter(v as number) : String(v)} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={140} />
          </>
        )}
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {bars.map(({ key, name, color }) => (
          <Bar key={key} dataKey={key} name={name} fill={color ?? COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={32}>
            {colorize && data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        ))}
      </RechartsBar>
    </ResponsiveContainer>
  )
}

export function DonutChart({ data = [], nameKey = 'name', valueKey = 'value', height = 280 }: DonutChartProps) {
  if (!data.length) return <div className="empty-state">No data available</div>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
        </Pie>
        <Tooltip formatter={(v) => Number(v).toLocaleString()} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} />
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  )
}
