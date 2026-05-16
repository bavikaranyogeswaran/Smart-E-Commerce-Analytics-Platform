import { useState } from 'react'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import Header from '../components/Header'
import KPICard from '../components/KPICard'
import LineChart from '../components/LineChart'
import { BarChart } from '../components/BarChart'
import Filters from '../components/Filters'
import type { FilterState } from '../components/Filters'
import { useApi } from '../hooks/useApi'
import { fetchRevenueKPI, fetchSalesTrends, fetchCategoryPerformance } from '../services/api'

const fmtK = (v: number) =>
  v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `R$${(v / 1_000).toFixed(0)}k`
  : `R$${v}`

export default function SalesAnalytics() {
  const [filters, setFilters] = useState<FilterState>({ start_date: '', end_date: '', granularity: 'monthly' })
  const [tick, setTick] = useState(0)

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))

  const { data: kpi        } = useApi(fetchRevenueKPI,         params, [tick])
  const { data: trends,    loading: tl } = useApi(fetchSalesTrends,        params, [tick])
  const { data: categories,loading: cl } = useApi(fetchCategoryPerformance, { ...params, limit: 12 }, [tick])

  const trendData = (trends ?? []).map(t => ({
    period:  t.period,
    revenue: Math.round(t.total_revenue),
    orders:  t.total_orders,
  }))

  const catData = (categories ?? []).slice(0, 12).map(c => ({
    name:    (c.category_name_english ?? 'Other').replace(/_/g, ' ').slice(0, 24),
    revenue: Math.round(c.total_revenue),
    orders:  c.total_orders,
  }))

  return (
    <div>
      <Header title="Sales Analytics" subtitle="Revenue trends, category performance, and order analysis" onRefresh={() => setTick(t => t + 1)} />
      <div className="page-body">
        <Filters filters={filters} onChange={setFilters} />

        <div className="kpi-grid">
          <KPICard label="Total Revenue"   value={kpi?.total_revenue    ?? 0} icon={DollarSign}   variant="revenue"   type="currency" />
          <KPICard label="Total Orders"    value={kpi?.total_orders     ?? 0} icon={ShoppingCart} variant="orders"    type="number" />
          <KPICard label="Items Sold"      value={kpi?.total_items      ?? 0} icon={TrendingUp}   variant="customers" type="number" />
          <KPICard label="Avg Order Value" value={kpi?.avg_order_value  ?? 0} icon={DollarSign}   variant="delivery"  type="currency" />
        </div>

        <div className="chart-card fade-in" style={{ marginBottom: 16 }}>
          <div className="chart-header">
            <div><div className="chart-title">Revenue Over Time</div><div className="chart-subtitle">Toggle granularity with the filter above</div></div>
          </div>
          {tl ? <div className="loading-state"><div className="spinner" /></div> : (
            <LineChart data={trendData} lines={[{ key: 'revenue', color: '#8b5cf6', name: 'Revenue (R$)' }, { key: 'orders', color: '#06b6d4', name: 'Orders' }]} xKey="period" formatter={fmtK} yTickFormatter={fmtK} height={300} />
          )}
        </div>

        <div className="chart-card fade-in stagger-1">
          <div className="chart-header">
            <div><div className="chart-title">Revenue by Category</div><div className="chart-subtitle">Top 12 product categories</div></div>
          </div>
          {cl ? <div className="loading-state"><div className="spinner" /></div> : (
            <BarChart data={catData} bars={[{ key: 'revenue', name: 'Revenue (R$)', color: '#10b981' }]} xKey="name" layout="horizontal" formatter={fmtK} colorize height={320} />
          )}
        </div>
      </div>
    </div>
  )
}
