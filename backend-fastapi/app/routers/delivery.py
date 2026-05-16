"""
================================================================
FILE: app/routers/delivery.py
ENDPOINTS:
  GET /delivery/avg-time    — Overall avg delivery time & on-time rate
  GET /delivery/performance — Delivery KPIs broken down by state
================================================================
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.database import get_db
from app.schemas import DeliveryAvgTime, DeliveryByState

router = APIRouter()


@router.get("/avg-time", response_model=DeliveryAvgTime, summary="Get overall average delivery time")
def get_avg_delivery_time(
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns overall delivery performance KPIs:
    - Average actual delivery days
    - Average estimated delivery days
    - Average delay (actual minus estimated, positive = late)
    - On-time delivery rate (%)
    - Total delivered orders counted
    """
    date_filter = ""
    params: dict = {}
    if start_date:
        date_filter += " AND f.purchase_timestamp >= :start_date"
        params["start_date"] = start_date
    if end_date:
        date_filter += " AND f.purchase_timestamp <= :end_date"
        params["end_date"] = end_date

    sql = text(f"""
        SELECT
            ROUND(AVG(f.actual_delivery_days)::numeric, 2)::float                                  AS avg_actual_days,
            ROUND(AVG(f.estimated_delivery_days)::numeric, 2)::float                               AS avg_estimated_days,
            ROUND(AVG(f.delivery_delay_days)::numeric, 2)::float                                   AS avg_delay_days,
            ROUND(
                SUM(CASE WHEN f.is_on_time THEN 1 ELSE 0 END)::numeric /
                NULLIF(COUNT(*), 0) * 100
            , 2)::float                                                                            AS on_time_rate,
            COUNT(*)::int                                                                          AS total_orders
        FROM warehouse.fact_orders f
        WHERE f.actual_delivery_days IS NOT NULL
        AND f.order_status = 'delivered'
        {date_filter}
    """)

    row = db.execute(sql, params).mappings().one()
    return DeliveryAvgTime(**dict(row))


@router.get("/performance", response_model=List[DeliveryByState], summary="Get delivery performance by state")
def get_delivery_by_state(
    state: Optional[str] = Query(None, description="Filter to a specific state code, e.g. SP"),
    limit: int = Query(27, ge=1, le=50, description="Number of states to return"),
    db: Session = Depends(get_db)
):
    """
    Returns delivery performance broken down by Brazilian state.
    Queries the `warehouse.delivery_performance` mart.
    Shows avg delivery days and on-time rate per state.
    """
    filters = ""
    params: dict = {"limit": limit}
    if state:
        filters += " AND UPPER(dp.state) = UPPER(:state)"
        params["state"] = state

    sql = text(f"""
        SELECT
            dp.state,
            ROUND(AVG(dp.avg_actual_days)::numeric, 2)::float   AS avg_actual_days,
            ROUND(AVG(dp.on_time_rate)::numeric * 100, 2)::float AS on_time_rate,
            SUM(dp.total_orders)::int                            AS total_orders
        FROM warehouse.delivery_performance dp
        WHERE dp.state IS NOT NULL
        {filters}
        GROUP BY dp.state
        ORDER BY on_time_rate DESC
        LIMIT :limit
    """)

    rows = db.execute(sql, params).mappings().all()
    return [DeliveryByState(**dict(r)) for r in rows]
