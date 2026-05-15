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
    
    SUM(CASE WHEN f.is_on_time THEN 1 ELSE 0 END) AS on_time_count,
    SUM(CASE WHEN NOT f.is_on_time THEN 1 ELSE 0 END) AS late_count,
    
    (SUM(CASE WHEN f.is_on_time THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT f.order_id), 0)) AS on_time_rate

FROM fact f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_customer c ON f.customer_key = c.customer_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE f.actual_delivery_days IS NOT NULL
GROUP BY 1, 2, 3, 4
