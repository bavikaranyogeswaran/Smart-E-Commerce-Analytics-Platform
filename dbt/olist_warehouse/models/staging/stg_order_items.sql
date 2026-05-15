SELECT
    order_id,
    order_item_id,
    product_id,
    seller_id,
    shipping_limit_date::timestamp AS shipping_limit_date,
    price::numeric(12,2) AS price,
    freight_value::numeric(12,2) AS freight_value
FROM {{ source('staging', 'order_items') }}
WHERE order_id IS NOT NULL
