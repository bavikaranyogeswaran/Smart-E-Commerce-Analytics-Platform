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
    d.full_date AS period_date,
    d.year,
    d.month,
    d.month_name,
    c.state,
    p.category_name_english,
    
    SUM(f.price + f.freight_value) AS total_revenue,
    COUNT(DISTINCT f.order_id) AS total_orders,
    COUNT(f.order_item_id) AS total_items,
    AVG(f.price + f.freight_value) AS avg_order_value,
    SUM(f.freight_value) AS total_freight

FROM fact f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_customer c ON f.customer_key = c.customer_key
JOIN dim_product p ON f.product_key = p.product_key
GROUP BY 1, 2, 3, 4, 5, 6
