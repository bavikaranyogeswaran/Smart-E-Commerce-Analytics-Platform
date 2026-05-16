import axios from 'axios'
import type {
  RevenueKPI, OrdersKPI, SalesTrend, TopCustomer, RFMSegment,
  TopProduct, CategoryPerformance, DeliveryAvgTime, DeliveryByState,
  DateRangeParams, ProductParams, CustomerParams, TrendsParams,
} from '../types/api'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 })

// ── KPIs ──────────────────────────────────────────────────────
export const fetchRevenueKPI = (params: DateRangeParams = {}): Promise<RevenueKPI> =>
  api.get<RevenueKPI>('/kpis/revenue', { params }).then(r => r.data)

export const fetchOrdersKPI = (params: DateRangeParams = {}): Promise<OrdersKPI[]> =>
  api.get<OrdersKPI[]>('/kpis/orders', { params }).then(r => r.data)

// ── Sales ─────────────────────────────────────────────────────
export const fetchSalesTrends = (params: TrendsParams = {}): Promise<SalesTrend[]> =>
  api.get<SalesTrend[]>('/sales/trends', { params }).then(r => r.data)

// ── Customers ─────────────────────────────────────────────────
export const fetchTopCustomers = (params: CustomerParams = {}): Promise<TopCustomer[]> =>
  api.get<TopCustomer[]>('/customers/top', { params }).then(r => r.data)

export const fetchRFMSegments = (): Promise<RFMSegment[]> =>
  api.get<RFMSegment[]>('/customers/rfm').then(r => r.data)

// ── Products ──────────────────────────────────────────────────
export const fetchTopProducts = (params: ProductParams = {}): Promise<TopProduct[]> =>
  api.get<TopProduct[]>('/products/top', { params }).then(r => r.data)

export const fetchCategoryPerformance = (params: ProductParams = {}): Promise<CategoryPerformance[]> =>
  api.get<CategoryPerformance[]>('/products/categories', { params }).then(r => r.data)

// ── Delivery ──────────────────────────────────────────────────
export const fetchAvgDelivery = (params: DateRangeParams = {}): Promise<DeliveryAvgTime> =>
  api.get<DeliveryAvgTime>('/delivery/avg-time', { params }).then(r => r.data)

export const fetchDeliveryByState = (params: { state?: string } = {}): Promise<DeliveryByState[]> =>
  api.get<DeliveryByState[]>('/delivery/performance', { params }).then(r => r.data)
