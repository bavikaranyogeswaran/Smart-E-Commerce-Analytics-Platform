import { useState } from 'react'
import { Package, Star, DollarSign, TrendingUp } from 'lucide-react'
import Header from '../components/Header'
import KPICard from '../components/KPICard'
import { BarChart } from '../components/BarChart'
import Filters from '../components/Filters'
import type { FilterState } from '../components/Filters'
import { useApi } from '../hooks/useApi'
import { fetchTopProducts, fetchCategoryPerformance } from '../services/api'

const fmt = (v: number): string => `R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
const fmtK = (v: number): string => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`

export default function ProductPerformance() {
  const [filters, setFilters] = useState<FilterState>({ start_date: '', end_date: '', category: '' })
  const [tick, setTick] = useState(0)

  const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))

  const { data: products,   loading: pl } = useApi(fetchTopProducts,         { ...params, limit: 20 }, [tick])
  const { data: categories, loading: cl } = useApi(fetchCategoryPerformance, { ...params, limit: 15 }, [tick])

  const catData = (categories ?? []).slice(0, 15).map(c => ({
    name:    (c.category_name_english ?? 'Other').replace(/_/g, ' ').slice(0, 26),
    revenue: Math.round(c.total_revenue),
    orders:  c.total_orders,
    score:   +(c.avg_review_score ?? 0).toFixed(2),
  }))

  const topProduct = (products ?? [])[0]

  return (
    <>
      <Header title="Product Performance" subtitle="Top products, category rankings, and review scores" onRefresh={() => setTick(t => t + 1)} />
      <div className="page-body">
        <Filters filters={filters} onChange={setFilters} />

        <div className="kpi-grid">
          <KPICard label="Top Product Revenue" value={topProduct?.total_revenue    ?? 0} icon={DollarSign} variant="revenue"   type="currency" />
          <KPICard label="Top Product Orders"  value={topProduct?.total_orders     ?? 0} icon={Package}    variant="orders"    type="number" />
          <KPICard label="Top Avg Price"       value={topProduct?.avg_price        ?? 0} icon={TrendingUp} variant="customers" type="currency" />
          <KPICard label="Top Review Score"    value={topProduct?.avg_review_score ?? 0} icon={Star}       variant="delivery"  type="percent" />
        </div>

        <div className="chart-card fade-in" style={{ marginBottom: 16 }}>
          <div className="chart-header"><div><div className="chart-title">Revenue by Category</div><div className="chart-subtitle">Top 15 categories by total revenue</div></div></div>
          {cl ? <div className="loading-state"><div className="spinner" /></div> : (
            <BarChart data={catData} bars={[{ key: 'revenue', name: 'Revenue', color: '#8b5cf6' }]} xKey="name" layout="horizontal" formatter={fmtK} colorize height={340} />
          )}
        </div>

        <div className="chart-card fade-in stagger-1" style={{ marginBottom: 16 }}>
          <div className="chart-header"><div><div className="chart-title">Avg Review Score by Category</div><div className="chart-subtitle">Customer satisfaction per category (1–5)</div></div></div>
          {cl ? <div className="loading-state"><div className="spinner" /></div> : (
            <BarChart data={catData} bars={[{ key: 'score', name: 'Avg Score', color: '#f59e0b' }]} xKey="name" layout="horizontal" formatter={(v) => v.toFixed(2)} height={300} />
          )}
        </div>

        <div className="chart-card fade-in stagger-2">
          <div className="chart-header"><div><div className="chart-title">Top Products</div><div className="chart-subtitle">Best performing individual products</div></div></div>
          {pl ? <div className="loading-state"><div className="spinner" /></div> : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Product ID</th><th>Category</th><th>Orders</th><th>Avg Price</th><th>Total Revenue</th><th>Review Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(products ?? []).map((p, i) => (
                    <tr key={p.product_id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{p.product_id.slice(0, 12)}…</td>
                      <td><span className="badge badge-cyan">{(p.category_name_english ?? 'N/A').replace(/_/g, ' ').slice(0, 20)}</span></td>
                      <td>{p.total_orders}</td>
                      <td>{fmt(p.avg_price)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>{fmt(p.total_revenue)}</td>
                      <td>{p.avg_review_score != null ? <span style={{ color: '#f59e0b' }}>⭐ {p.avg_review_score.toFixed(1)}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
