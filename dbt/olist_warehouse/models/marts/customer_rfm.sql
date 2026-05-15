{{ config(materialized='table') }}

WITH fact AS (
    SELECT * FROM {{ ref('fact_orders') }}
),
dim_customer AS (
    SELECT * FROM {{ ref('dim_customer') }}
),
customer_agg AS (
    SELECT
        c.customer_unique_id,
        MAX(c.city) AS city,
        MAX(c.state) AS state,
        MAX(f.purchase_timestamp)::date AS last_purchase_date,
        COUNT(DISTINCT f.order_id) AS frequency,
        SUM(f.price + f.freight_value) AS monetary_value,
        AVG(f.review_score) AS avg_review_score
    FROM fact f
    JOIN dim_customer c ON f.customer_key = c.customer_key
    GROUP BY 1
),
rfm_calc AS (
    SELECT
        *,
        -- Assume current date is the max date in the dataset (2018-09-03)
        -- Since this is static data, we hardcode the reference date or use max
        (SELECT MAX(last_purchase_date) FROM customer_agg) - last_purchase_date AS recency_days
    FROM customer_agg
)

SELECT
    *,
    CASE 
        WHEN recency_days <= 90 AND frequency >= 2 AND monetary_value >= 200 THEN 'High Value'
        WHEN recency_days <= 180 AND frequency >= 1 THEN 'Mid Value'
        WHEN recency_days > 180 AND frequency = 1 THEN 'Low Value'
        ELSE 'Churned'
    END AS rfm_segment
FROM rfm_calc
