{{ config(materialized='table') }}

WITH customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),
geo AS (
    SELECT * FROM {{ ref('stg_geolocation') }}
)
SELECT
    -- Generate surrogate key
    {{ dbt_utils.generate_surrogate_key(['c.customer_id']) }} AS customer_key,
    c.customer_id,
    c.customer_unique_id,
    c.zip_code_prefix,
    c.city,
    c.state,
    g.latitude,
    g.longitude
FROM customers c
LEFT JOIN geo g ON c.zip_code_prefix = g.zip_code_prefix
