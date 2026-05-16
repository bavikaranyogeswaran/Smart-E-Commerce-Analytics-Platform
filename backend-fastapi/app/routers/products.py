"""
================================================================
FILE: app/routers/products.py
ENDPOINTS:
  GET /products/top        — Top N products by revenue
  GET /products/categories — Revenue and reviews by category
================================================================
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.database import get_db
from app.schemas import TopProduct, CategoryPerformance

router = APIRouter()


@router.get("/top", response_model=List[TopProduct], summary="Get top products by revenue")
def get_top_products(
    limit: int = Query(10, ge=1, le=100, description="Number of products to return"),
    category: Optional[str] = Query(None, description="Filter by category (English name)"),
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns top N products ranked by total revenue.
    Joins `warehouse.fact_orders` with `warehouse.dim_product`.
    """
    filters = ""
    params: dict = {"limit": limit}
    if category:
        filters += " AND LOWER(p.category_name_english) LIKE LOWER(:category)"
        params["category"] = f"%{category}%"
    if start_date:
        filters += " AND f.purchase_timestamp >= :start_date"
        params["start_date"] = start_date
    if end_date:
        filters += " AND f.purchase_timestamp <= :end_date"
        params["end_date"] = end_date

    sql = text(f"""
        SELECT
            p.product_id,
            p.category_name_english,
            SUM(f.price + f.freight_value)::float       AS total_revenue,
            COUNT(DISTINCT f.order_id)::int             AS total_orders,
            ROUND(AVG(f.review_score)::numeric, 2)::float AS avg_review_score,
            ROUND(AVG(f.price)::numeric, 2)::float      AS avg_price
        FROM warehouse.fact_orders f
        JOIN warehouse.dim_product p ON f.product_key = p.product_key
        WHERE p.product_id IS NOT NULL
        {filters}
        GROUP BY p.product_id, p.category_name_english
        ORDER BY total_revenue DESC
        LIMIT :limit
    """)

    rows = db.execute(sql, params).mappings().all()
    return [TopProduct(**dict(r)) for r in rows]


@router.get("/categories", response_model=List[CategoryPerformance], summary="Get revenue by product category")
def get_category_performance(
    limit: int = Query(20, ge=1, le=100, description="Number of categories to return"),
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns revenue, order count, and average review score per product category.
    """
    filters = ""
    params: dict = {"limit": limit}
    if start_date:
        filters += " AND f.purchase_timestamp >= :start_date"
        params["start_date"] = start_date
    if end_date:
        filters += " AND f.purchase_timestamp <= :end_date"
        params["end_date"] = end_date

    sql = text(f"""
        SELECT
            COALESCE(p.category_name_english, 'Uncategorized') AS category_name_english,
            SUM(f.price + f.freight_value)::float               AS total_revenue,
            COUNT(DISTINCT f.order_id)::int                     AS total_orders,
            ROUND(AVG(f.review_score)::numeric, 2)::float       AS avg_review_score
        FROM warehouse.fact_orders f
        JOIN warehouse.dim_product p ON f.product_key = p.product_key
        WHERE 1=1
        {filters}
        GROUP BY p.category_name_english
        ORDER BY total_revenue DESC
        LIMIT :limit
    """)

    rows = db.execute(sql, params).mappings().all()
    return [CategoryPerformance(**dict(r)) for r in rows]
