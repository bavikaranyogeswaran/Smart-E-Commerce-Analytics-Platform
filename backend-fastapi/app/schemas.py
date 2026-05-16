from pydantic import BaseModel
from typing import Optional, List
from datetime import date


# ── KPI Schemas ────────────────────────────────────────────────
class RevenueKPI(BaseModel):
    total_revenue: float
    total_orders: int
    total_items: int
    avg_order_value: float
    total_freight: float


class OrdersKPI(BaseModel):
    order_status: str
    count: int
    pct_of_total: float


# ── Sales Trend Schemas ────────────────────────────────────────
class SalesTrend(BaseModel):
    period: str            # "2018-01" or "2018-01-15"
    year: int
    month: Optional[int] = None
    total_revenue: float
    total_orders: int
    avg_order_value: float


# ── Customer Schemas ───────────────────────────────────────────
class TopCustomer(BaseModel):
    customer_unique_id: str
    city: Optional[str] = None
    state: Optional[str] = None
    total_spent: float
    total_orders: int
    avg_review_score: Optional[float] = None


class RFMSegment(BaseModel):
    rfm_segment: str
    customer_count: int
    total_revenue: float
    avg_monetary: float
    pct_of_customers: float


# ── Product Schemas ────────────────────────────────────────────
class TopProduct(BaseModel):
    product_id: str
    category_name_english: Optional[str] = None
    total_revenue: float
    total_orders: int
    avg_review_score: Optional[float] = None
    avg_price: float


class CategoryPerformance(BaseModel):
    category_name_english: Optional[str] = None
    total_revenue: float
    total_orders: int
    avg_review_score: Optional[float] = None


# ── Delivery Schemas ───────────────────────────────────────────
class DeliveryAvgTime(BaseModel):
    avg_actual_days: float
    avg_estimated_days: float
    avg_delay_days: float
    on_time_rate: float
    total_orders: int


class DeliveryByState(BaseModel):
    state: str
    avg_actual_days: float
    on_time_rate: float
    total_orders: int


# ── Generic ────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    message: Optional[str] = None
