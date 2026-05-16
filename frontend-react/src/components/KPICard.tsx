import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

type ValueType = 'number' | 'currency' | 'percent' | 'days'
type KPIVariant = 'revenue' | 'orders' | 'customers' | 'delivery'

interface KPICardProps {
  label: string
  value: number
  sub?: string
  icon?: LucideIcon
  variant?: KPIVariant
  type?: ValueType
  trend?: number
}

function useCounter(target: number, duration = 1200): number {
  const [value, setValue] = useState<number>(0)
  useEffect(() => {
    if (!target) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

function formatValue(raw: number, type: ValueType): string {
  switch (type) {
    case 'currency': return `R$${raw.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    case 'number':   return raw.toLocaleString()
    case 'percent':  return `${raw.toFixed(1)}%`
    case 'days':     return `${raw.toFixed(1)}d`
    default:         return String(raw)
  }
}

export default function KPICard({
  label, value, sub, icon: Icon,
  variant = 'revenue', type = 'number', trend,
}: KPICardProps) {
  const animated = useCounter(value)

  return (
    <div className={`kpi-card ${variant} fade-in`}>
      <div className={`kpi-icon ${variant}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{formatValue(animated, type)}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <span className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
