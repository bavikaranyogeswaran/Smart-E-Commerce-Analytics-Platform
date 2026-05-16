"""
================================================================
FILE: app/routers/sales.py
ENDPOINTS:
  GET /sales/trends  — Daily or monthly revenue trends
================================================================
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from enum import Enum

from app.database import get_db
from app.schemas import SalesTrend

router = APIRouter()


class Granularity(str, Enum):
    daily = "daily"
    monthly = "monthly"
    yearly = "yearly"


@router.get("/trends", response_model=List[SalesTrend], summary="Get sales revenue trends")
def get_sales_trends(
    granularity: Granularity = Query(Granularity.monthly, description="Aggregation granularity"),
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns revenue trends aggregated by day, month, or year.
    Queries the `warehouse.revenue_summary` mart.
    """
    date_filter = ""
    params = {}
    if start_date:
        date_filter += " AND rs.period_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        date_filter += " AND rs.period_date <= :end_date"
        params["end_date"] = end_date

    if granularity == Granularity.daily:
        period_expr = "TO_CHAR(rs.period_date, 'YYYY-MM-DD')"
        group_by = "period_date, rs.year"
        month_select = "EXTRACT(MONTH FROM rs.period_date)::int AS month"
    elif granularity == Granularity.monthly:
        period_expr = "TO_CHAR(rs.period_date, 'YYYY-MM')"
        group_by = "TO_CHAR(rs.period_date, 'YYYY-MM'), rs.year, EXTRACT(MONTH FROM rs.period_date)"
        month_select = "EXTRACT(MONTH FROM rs.period_date)::int AS month"
    else:  # yearly
        period_expr = "rs.year::text"
        group_by = "rs.year"
        month_select = "NULL::int AS month"

    sql = text(f"""
        SELECT
            {period_expr} AS period,
            rs.year::int AS year,
            {month_select},
            SUM(rs.total_revenue)::float  AS total_revenue,
            SUM(rs.total_orders)::int     AS total_orders,
            AVG(rs.avg_order_value)::float AS avg_order_value
        FROM warehouse.revenue_summary rs
        WHERE 1=1
        {date_filter}
        GROUP BY {group_by}
        ORDER BY period ASC
        LIMIT 500
    """)

    rows = db.execute(sql, params).mappings().all()
    return [SalesTrend(**dict(r)) for r in rows]
