import { useState } from 'react'
import { Truck, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '../components/Header'
import KPICard from '../components/KPICard'
import { BarChart } from '../components/BarChart'
import Filters from '../components/Filters'
import type { FilterState } from '../components/Filters'
import { useApi } from '../hooks/useApi'
import { fetchAvgDelivery, fetchDeliveryByState } from '../services/api'

export default function DeliveryAnalytics() {
  const [filters, setFilters] = useState<FilterState>({ start_date: '', end_date: '', state: '' })
  const [tick, setTick] = useState(0)

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))

  const { data: avg } = useApi(fetchAvgDelivery,     params, [tick])
  const { data: states, loading: sl } = useApi(fetchDeliveryByState, {},     [tick])

  const stateData = (states ?? []).slice(0, 27).map(s => ({
    state:    s.state,
    avg_days: +(s.avg_actual_days ?? 0).toFixed(1),
    on_time:  +(s.on_time_rate ?? 0).toFixed(1),
    orders:   s.total_orders,
  }))

  return (
    <div>
      <Header title="Delivery Analytics" subtitle="Average delivery times, on-time rates, and state-level performance" onRefresh={() => setTick(t => t + 1)} />
      <div className="page-body">
        <Filters filters={filters} onChange={setFilters} />

        <div className="kpi-grid">
          <KPICard label="Avg Actual Days"    value={avg?.avg_actual_days    ?? 0} icon={Truck}       variant="orders"    type="days" />
          <KPICard label="Avg Estimated Days" value={avg?.avg_estimated_days ?? 0} icon={Clock}       variant="delivery"  type="days" />
          <KPICard label="On-Time Rate"       value={avg?.on_time_rate       ?? 0} icon={CheckCircle} variant="customers" type="percent" />
          <KPICard label="Avg Delay"          value={avg?.avg_delay_days     ?? 0} icon={AlertCircle} variant="revenue"   type="days" />
        </div>

        <div className="chart-card fade-in" style={{ marginBottom: 16 }}>
          <div className="chart-header"><div><div className="chart-title">On-Time Delivery Rate by State</div><div className="chart-subtitle">% of orders delivered on or before estimated date</div></div></div>
          {sl ? <div className="loading-state"><div className="spinner" /></div> : (
            <BarChart data={stateData} bars={[{ key: 'on_time', name: 'On-Time Rate (%)', color: '#10b981' }]} xKey="state" layout="vertical" formatter={(v) => `${v}%`} height={400} />
          )}
        </div>

        <div className="chart-card fade-in stagger-1" style={{ marginBottom: 16 }}>
          <div className="chart-header"><div><div className="chart-title">Average Delivery Days by State</div><div className="chart-subtitle">Lower is better</div></div></div>
          {sl ? <div className="loading-state"><div className="spinner" /></div> : (
            <BarChart data={[...stateData].sort((a,b) => b.avg_days - a.avg_days)} bars={[{ key: 'avg_days', name: 'Avg Days', color: '#f59e0b' }]} xKey="state" layout="vertical" formatter={(v) => `${v}d`} height={400} />
          )}
        </div>

        <div className="chart-card fade-in stagger-2">
          <div className="chart-header"><div className="chart-title">Delivery Performance by State</div></div>
          {sl ? <div className="loading-state"><div className="spinner" /></div> : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>State</th><th>Total Orders</th><th>Avg Delivery Days</th><th>On-Time Rate</th><th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {(states ?? []).map(s => (
                    <tr key={s.state}>
                      <td><span className="badge badge-violet">{s.state}</span></td>
                      <td>{Number(s.total_orders).toLocaleString()}</td>
                      <td>{s.avg_actual_days?.toFixed(1)}d</td>
                      <td style={{ fontWeight: 600, color: s.on_time_rate >= 90 ? 'var(--accent-emerald)' : s.on_time_rate >= 75 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                        {s.on_time_rate?.toFixed(1)}%
                      </td>
                      <td>
                        <span className={`badge ${s.on_time_rate >= 90 ? 'badge-emerald' : s.on_time_rate >= 75 ? 'badge-amber' : 'badge-red'}`}>
                          {s.on_time_rate >= 90 ? 'Excellent' : s.on_time_rate >= 75 ? 'Good' : 'Needs Work'}
                        </span>
                      </td>
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
