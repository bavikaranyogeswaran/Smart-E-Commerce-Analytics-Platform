// ================================================================
// FILE: src/types/api.ts
// PURPOSE: Shared TypeScript interfaces matching FastAPI response schemas
// ================================================================

export interface RevenueKPI {
  total_revenue: number
  total_orders: number
  total_items: number
  avg_order_value: number
  total_freight: number
}

export interface OrdersKPI {
  order_status: string
  count: number
  pct_of_total: number
}

export interface SalesTrend {
  period: string
  year: number
  month: number | null
  total_revenue: number
  total_orders: number
  avg_order_value: number
}

export interface TopCustomer {
  customer_unique_id: string
  city: string | null
  state: string | null
  total_spent: number
  total_orders: number
  avg_review_score: number | null
}

export interface RFMSegment {
  rfm_segment: string
  customer_count: number
  total_revenue: number
  avg_monetary: number
  pct_of_customers: number
}

export interface TopProduct {
  product_id: string
  category_name_english: string | null
  total_revenue: number
  total_orders: number
  avg_review_score: number | null
  avg_price: number
}

export interface CategoryPerformance {
  category_name_english: string | null
  total_revenue: number
  total_orders: number
  avg_review_score: number | null
}

export interface DeliveryAvgTime {
  avg_actual_days: number
  avg_estimated_days: number
  avg_delay_days: number
  on_time_rate: number
  total_orders: number
}

export interface DeliveryByState {
  state: string
  avg_actual_days: number
  on_time_rate: number
  total_orders: number
}

// Generic query param types
export interface DateRangeParams {
  start_date?: string
  end_date?: string
}

export interface ProductParams extends DateRangeParams {
  limit?: number
  category?: string
}

export interface CustomerParams extends DateRangeParams {
  limit?: number
  state?: string
}

export type Granularity = 'daily' | 'monthly' | 'yearly'

export interface TrendsParams extends DateRangeParams {
  granularity?: Granularity
}
