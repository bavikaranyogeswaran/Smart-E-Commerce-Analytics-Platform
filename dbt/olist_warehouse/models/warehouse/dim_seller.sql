{{ config(materialized='table') }}

WITH sellers AS (
    SELECT * FROM {{ ref('stg_sellers') }}
),
geo AS (
    SELECT * FROM {{ ref('stg_geolocation') }}
)
SELECT
    {{ dbt_utils.generate_surrogate_key(['s.seller_id']) }} AS seller_key,
    s.seller_id,
    s.zip_code_prefix,
    s.city,
    s.state,
    g.latitude,
    g.longitude
FROM sellers s
LEFT JOIN geo g ON s.zip_code_prefix = g.zip_code_prefix
