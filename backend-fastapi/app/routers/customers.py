"""
================================================================
FILE: app/routers/customers.py
ENDPOINTS:
  GET /customers/top   — Top N customers by total spend
  GET /customers/rfm   — RFM segment distribution
================================================================
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.database import get_db
from app.schemas import TopCustomer, RFMSegment

router = APIRouter()


@router.get("/top", response_model=List[TopCustomer], summary="Get top customers by spend")
def get_top_customers(
    limit: int = Query(10, ge=1, le=100, description="Number of customers to return"),
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    state: Optional[str] = Query(None, description="Filter by customer state (e.g. SP)"),
    db: Session = Depends(get_db)
):
    """
    Returns top N customers ranked by total spend.
    Joins `warehouse.fact_orders` with `warehouse.dim_customer`.
    """
    filters = ""
    params: dict = {"limit": limit}
    if start_date:
        filters += " AND f.purchase_timestamp >= :start_date"
        params["start_date"] = start_date
    if end_date:
        filters += " AND f.purchase_timestamp <= :end_date"
        params["end_date"] = end_date
    if state:
        filters += " AND UPPER(c.state) = UPPER(:state)"
        params["state"] = state

    sql = text(f"""
        SELECT
            c.customer_unique_id,
            MAX(c.city)                             AS city,
            MAX(c.state)                            AS state,
            SUM(f.price + f.freight_value)::float   AS total_spent,
            COUNT(DISTINCT f.order_id)::int         AS total_orders,
            ROUND(AVG(f.review_score)::numeric, 2)::float AS avg_review_score
        FROM warehouse.fact_orders f
        JOIN warehouse.dim_customer c ON f.customer_key = c.customer_key
        WHERE c.customer_unique_id IS NOT NULL
        {filters}
        GROUP BY c.customer_unique_id
        ORDER BY total_spent DESC
        LIMIT :limit
    """)

    rows = db.execute(sql, params).mappings().all()
    return [TopCustomer(**dict(r)) for r in rows]


@router.get("/rfm", response_model=List[RFMSegment], summary="Get RFM customer segment breakdown")
def get_rfm_segments(
    db: Session = Depends(get_db)
):
    """
    Returns RFM (Recency, Frequency, Monetary) segment distribution.
    Queries the `warehouse.customer_rfm` mart table.
    """
    sql = text("""
        SELECT
            rfm_segment,
            COUNT(*)::int                               AS customer_count,
            SUM(monetary_value)::float                  AS total_revenue,
            ROUND(AVG(monetary_value)::numeric, 2)::float AS avg_monetary,
            ROUND(
                COUNT(*)::numeric /
                NULLIF((SELECT COUNT(*) FROM warehouse.customer_rfm), 0) * 100
            , 2)::float                                 AS pct_of_customers
        FROM warehouse.customer_rfm
        WHERE rfm_segment IS NOT NULL
        GROUP BY rfm_segment
        ORDER BY total_revenue DESC
    """)

    rows = db.execute(sql).mappings().all()
    return [RFMSegment(**dict(r)) for r in rows]
