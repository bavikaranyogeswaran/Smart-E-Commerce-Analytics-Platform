"""
================================================================
FILE: app/routers/kpis.py
ENDPOINTS:
  GET /kpis/revenue  — Total revenue, orders, avg order value
  GET /kpis/orders   — Order count broken down by status
================================================================
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.database import get_db
from app.schemas import RevenueKPI, OrdersKPI

router = APIRouter()


@router.get("/revenue", response_model=RevenueKPI, summary="Get overall revenue KPIs")
def get_revenue_kpis(
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns top-level revenue KPIs:
    - Total revenue
    - Total orders
    - Total items sold
    - Average order value
    - Total freight collected

    Queries the `warehouse.fact_orders` table.
    Optionally filter by a date range.
    """
    date_filter = ""
    params = {}
    if start_date:
        date_filter += " AND f.purchase_timestamp >= :start_date"
        params["start_date"] = start_date
    if end_date:
        date_filter += " AND f.purchase_timestamp <= :end_date"
        params["end_date"] = end_date

    sql = text(f"""
        SELECT
            COALESCE(SUM(f.price + f.freight_value), 0)::float            AS total_revenue,
            COUNT(DISTINCT f.order_id)::int                                AS total_orders,
            COUNT(f.order_item_id)::int                                    AS total_items,
            COALESCE(AVG(f.price + f.freight_value), 0)::float            AS avg_order_value,
            COALESCE(SUM(f.freight_value), 0)::float                      AS total_freight
        FROM warehouse.fact_orders f
        WHERE 1=1
        {date_filter}
    """)

    row = db.execute(sql, params).mappings().one()
    return RevenueKPI(**dict(row))


@router.get("/orders", response_model=List[OrdersKPI], summary="Get order counts by status")
def get_orders_kpis(
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns order counts grouped by order status (delivered, shipped, cancelled, etc.)
    with a percentage breakdown.
    """
    date_filter = ""
    params = {}
    if start_date:
        date_filter += " AND f.purchase_timestamp >= :start_date"
        params["start_date"] = start_date
    if end_date:
        date_filter += " AND f.purchase_timestamp <= :end_date"
        params["end_date"] = end_date

    sql = text(f"""
        WITH status_counts AS (
            SELECT
                f.order_status,
                COUNT(DISTINCT f.order_id) AS count
            FROM warehouse.fact_orders f
            WHERE f.order_status IS NOT NULL
            {date_filter}
            GROUP BY f.order_status
        ),
        totals AS (
            SELECT SUM(count) AS grand_total FROM status_counts
        )
        SELECT
            sc.order_status,
            sc.count::int AS count,
            ROUND((sc.count::numeric / t.grand_total * 100), 2)::float AS pct_of_total
        FROM status_counts sc, totals t
        ORDER BY sc.count DESC
    """)

    rows = db.execute(sql, params).mappings().all()
    return [OrdersKPI(**dict(r)) for r in rows]
