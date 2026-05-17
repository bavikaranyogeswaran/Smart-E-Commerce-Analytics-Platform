import { useState } from 'react'
import { DollarSign, ShoppingCart, Users, Truck } from 'lucide-react'
import Header from '../components/Header'
import KPICard from '../components/KPICard'
import LineChart from '../components/LineChart'
import { BarChart, DonutChart } from '../components/BarChart'
import { useApi } from '../hooks/useApi'
import {
  fetchRevenueKPI, fetchOrdersKPI,
  fetchSalesTrends, fetchTopProducts, fetchAvgDelivery,
} from '../services/api'
import type { DateRangeParams, TrendsParams, ProductParams } from '../types/api'

const fmtK = (v: number) =>
  v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `R$${(v / 1_000).toFixed(0)}k`
  : `R$${v}`

const emptyDate: DateRangeParams = {}
const monthlyParams: TrendsParams = { granularity: 'monthly' }
const top8: ProductParams = { limit: 8 }

export default function Dashboard() {
  const [tick, setTick] = useState(0)

  const { data: revenue } = useApi(fetchRevenueKPI, emptyDate, [tick])
  const { data: orders  } = useApi(fetchOrdersKPI,  emptyDate, [tick])
  const { data: trends  } = useApi(fetchSalesTrends, monthlyParams, [tick])
  const { data: topProds} = useApi(fetchTopProducts,  top8,    [tick])
  const { data: delivery} = useApi(fetchAvgDelivery,  emptyDate, [tick])

  const trendData = (trends ?? []).map(t => ({
    period: t.period,
    revenue: Math.round(t.total_revenue),
    orders:  t.total_orders,
  }))

  const prodData = (topProds ?? []).map(p => ({
    name:    (p.category_name_english ?? 'Other').slice(0, 22),
    revenue: Math.round(p.total_revenue),
  }))

  const statusData = (orders ?? []).map(o => ({
    name:  o.order_status,
    value: o.count,
  }))

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle="Key metrics across your entire e-commerce operation"
        onRefresh={() => setTick(t => t + 1)}
      />
      <div className="page-body">
        <div className="kpi-grid">
          <KPICard label="Total Revenue"    value={revenue?.total_revenue    ?? 0} sub={`${(revenue?.total_items ?? 0).toLocaleString()} items sold`} icon={DollarSign}   variant="revenue"   type="currency" />
          <KPICard label="Total Orders"     value={revenue?.total_orders     ?? 0} sub={`Avg: ${fmtK(revenue?.avg_order_value ?? 0)}`}               icon={ShoppingCart} variant="orders"    type="number" />
          <KPICard label="Avg Order Value"  value={revenue?.avg_order_value  ?? 0} sub="Per transaction"                                              icon={Users}        variant="customers" type="currency" />
          <KPICard label="Avg Delivery"     value={delivery?.avg_actual_days ?? 0} sub={`${(delivery?.on_time_rate ?? 0).toFixed(1)}% on-time`}       icon={Truck}        variant="delivery"  type="days" />
        </div>

        <div className="chart-grid">
          <div className="chart-card fade-in stagger-1">
            <div className="chart-header">
              <div>
                <div className="chart-title">Revenue Trend</div>
                <div className="chart-subtitle">Monthly revenue over time</div>
              </div>
            </div>
            <LineChart data={trendData} lines={[{ key: 'revenue', color: '#8b5cf6', name: 'Revenue (R$)' }]} xKey="period" formatter={fmtK} yTickFormatter={fmtK} />
          </div>

          <div className="chart-card fade-in stagger-2">
            <div className="chart-header">
              <div>
                <div className="chart-title">Order Status</div>
                <div className="chart-subtitle">Distribution by status</div>
              </div>
            </div>
            <DonutChart data={statusData} nameKey="name" valueKey="value" />
          </div>
        </div>

        <div className="chart-card fade-in stagger-3">
          <div className="chart-header">
            <div>
              <div className="chart-title">Top Products by Revenue</div>
              <div className="chart-subtitle">Best performing categories</div>
            </div>
          </div>
          <BarChart data={prodData} bars={[{ key: 'revenue', name: 'Revenue (R$)', color: '#06b6d4' }]} xKey="name" layout="horizontal" formatter={fmtK} colorize height={240} />
        </div>
      </div>
    </>
  )
}
