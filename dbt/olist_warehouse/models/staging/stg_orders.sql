SELECT
    order_id,
    customer_id,
    order_status,
    order_purchase_timestamp::timestamp AS purchase_timestamp,
    order_approved_at::timestamp AS approved_at,
    order_delivered_carrier_date::timestamp AS delivered_carrier_date,
    order_delivered_customer_date::timestamp AS delivered_customer_date,
    order_estimated_delivery_date::timestamp AS estimated_delivery_date
FROM {{ source('staging', 'orders') }}
WHERE order_id IS NOT NULL
