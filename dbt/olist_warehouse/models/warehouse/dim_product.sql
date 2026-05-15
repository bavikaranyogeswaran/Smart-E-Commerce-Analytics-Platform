{{ config(materialized='table') }}

SELECT
    {{ dbt_utils.generate_surrogate_key(['product_id']) }} AS product_key,
    product_id,
    category_name_pt,
    category_name_en AS category_name_english,
    name_length,
    description_length,
    photos_qty,
    weight_g,
    length_cm,
    height_cm,
    width_cm
FROM {{ ref('stg_products') }}
