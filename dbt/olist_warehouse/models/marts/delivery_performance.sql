{{ config(materialized='table') }}

WITH fact AS (
    SELECT * FROM {{ ref('fact_orders') }}
),
dim_date AS (
    SELECT * FROM {{ ref('dim_date') }}
),
dim_customer AS (
    SELECT * FROM {{ ref('dim_customer') }}
),
dim_product AS (
    SELECT * FROM {{ ref('dim_product') }}
)

SELECT
    c.state,
    p.category_name_english,
    d.year,
    d.month,
    
    COUNT(DISTINCT f.order_id) AS total_orders,
    AVG(f.actual_delivery_days) AS avg_actual_days,
    AVG(f.estimated_delivery_days) AS avg_estimated_days,
    
    COUNT(DISTINCT CASE WHEN f.is_on_time THEN f.order_id END) AS on_time_count,
    COUNT(DISTINCT CASE WHEN NOT f.is_on_time THEN f.order_id END) AS late_count,

    -- Rate is computed at the order grain (numerator & denominator both
    -- COUNT(DISTINCT order_id)) so per-row values are bounded to [0, 1].
    -- The previous version mixed item-grain numerator with order-grain
    -- denominator, producing ratios > 1.0 for states with multi-item orders.
    (COUNT(DISTINCT CASE WHEN f.is_on_time THEN f.order_id END)::numeric
        / NULLIF(COUNT(DISTINCT f.order_id), 0)) AS on_time_rate

FROM fact f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_customer c ON f.customer_key = c.customer_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE f.actual_delivery_days IS NOT NULL
GROUP BY 1, 2, 3, 4
