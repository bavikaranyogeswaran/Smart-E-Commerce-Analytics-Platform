import { useState } from 'react'
import { Users, TrendingUp, Star, MapPin } from 'lucide-react'
import Header from '../components/Header'
import KPICard from '../components/KPICard'
import { BarChart, DonutChart } from '../components/BarChart'
import Filters from '../components/Filters'
import type { FilterState } from '../components/Filters'
import { useApi } from '../hooks/useApi'
import { fetchTopCustomers, fetchRFMSegments } from '../services/api'

const fmt = (v: number): string =>
  `R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`

export default function CustomerInsights() {
  const [filters, setFilters] = useState<FilterState>({ start_date: '', end_date: '', state: '' })
  const [tick, setTick] = useState(0)

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))

  const { data: customers, loading: cl } = useApi(fetchTopCustomers, { ...params, limit: 20 }, [tick])
  const { data: rfm,       loading: rl } = useApi(fetchRFMSegments,  {}, [tick])

  const rfmDonut = (rfm ?? []).map(r => ({ name: r.rfm_segment, value: r.customer_count }))
  const rfmBar   = (rfm ?? []).map(r => ({
    segment:     r.rfm_segment,
    revenue:     Math.round(r.total_revenue),
    avg_monetary: Math.round(r.avg_monetary),
  }))

  const totalCustomers = (rfm ?? []).reduce((s, r) => s + r.customer_count, 0)
  const highValue = (rfm ?? []).find(r => r.rfm_segment === 'High Value')

  return (
    <div>
      <Header title="Customer Insights" subtitle="RFM segmentation, top spenders, and geographic distribution" onRefresh={() => setTick(t => t + 1)} />
      <div className="page-body">
        <Filters filters={filters} onChange={setFilters} />

        <div className="kpi-grid">
          <KPICard label="Total Customers"      value={totalCustomers}                  icon={Users}      variant="orders"    type="number" />
          <KPICard label="High Value Customers" value={highValue?.customer_count  ?? 0} icon={Star}       variant="revenue"   type="number" />
          <KPICard label="High Value Revenue"   value={highValue?.total_revenue   ?? 0} icon={TrendingUp} variant="customers" type="currency" />
          <KPICard label="Avg High-Val Spend"   value={highValue?.avg_monetary    ?? 0} icon={MapPin}     variant="delivery"  type="currency" />
        </div>

        <div className="chart-grid">
          <div className="chart-card fade-in stagger-1">
            <div className="chart-header"><div><div className="chart-title">RFM Segment Distribution</div><div className="chart-subtitle">Customer count by segment</div></div></div>
            {rl ? <div className="loading-state"><div className="spinner" /></div> : (
              <DonutChart data={rfmDonut} nameKey="name" valueKey="value" />
            )}
          </div>

          <div className="chart-card fade-in stagger-2">
            <div className="chart-header"><div><div className="chart-title">Revenue by RFM Segment</div><div className="chart-subtitle">Total spend per segment</div></div></div>
            {rl ? <div className="loading-state"><div className="spinner" /></div> : (
              <BarChart data={rfmBar} bars={[{ key: 'revenue', name: 'Revenue', color: '#8b5cf6' }]} xKey="segment" layout="vertical" formatter={(v) => `R$${(v / 1000).toFixed(0)}k`} colorize height={280} />
            )}
          </div>
        </div>

        <div className="chart-card fade-in stagger-3">
          <div className="chart-header"><div><div className="chart-title">Top Customers by Spend</div><div className="chart-subtitle">Top 20 individual customers</div></div></div>
          {cl ? <div className="loading-state"><div className="spinner" /></div> : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Customer ID</th><th>City</th><th>State</th><th>Orders</th><th>Total Spent</th><th>Avg Review</th>
                  </tr>
                </thead>
                <tbody>
                  {(customers ?? []).map((c, i) => (
                    <tr key={c.customer_unique_id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{c.customer_unique_id.slice(0, 12)}…</td>
                      <td>{c.city ?? '—'}</td>
                      <td><span className="badge badge-violet">{c.state}</span></td>
                      <td>{c.total_orders}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>{fmt(c.total_spent)}</td>
                      <td>{c.avg_review_score != null ? <span style={{ color: '#f59e0b' }}>⭐ {c.avg_review_score.toFixed(1)}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
