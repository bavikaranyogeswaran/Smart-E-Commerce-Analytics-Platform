{{ config(materialized='table') }}

WITH orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
),
items AS (
    SELECT * FROM {{ ref('stg_order_items') }}
),
reviews AS (
    SELECT * FROM {{ ref('stg_order_reviews') }}
),
payments AS (
    -- Group payments if a single order item fact logic requires it,
    -- but since an order can have multiple items and multiple payments,
    -- we distribute payment proportionally, or we keep payment separate.
    -- For simplicity, let's join at the item level and allocate payments proportionally 
    -- to the item value, or just link the primary payment key.
    -- Better yet, since fact grain is order item, and payment is at order level, 
    -- we can join the FIRST payment method, or total payment value.
    SELECT 
        order_id,
        MIN(payment_sequential) as first_payment_seq,
        SUM(payment_value) as total_payment_value
    FROM {{ ref('stg_order_payments') }}
    GROUP BY 1
)

SELECT
    items.order_id,
    items.order_item_id,

    -- Foreign Keys
    {{ dbt_utils.generate_surrogate_key(['orders.customer_id']) }} AS customer_key,
    {{ dbt_utils.generate_surrogate_key(['items.product_id']) }} AS product_key,
    {{ dbt_utils.generate_surrogate_key(['items.seller_id']) }} AS seller_key,
    TO_CHAR(orders.purchase_timestamp, 'YYYYMMDD')::integer AS date_key,
    {{ dbt_utils.generate_surrogate_key(['items.order_id', 'payments.first_payment_seq']) }} AS payment_key,

    orders.order_status,
    orders.purchase_timestamp,
    orders.approved_at,
    orders.delivered_carrier_date,
    orders.delivered_customer_date,
    orders.estimated_delivery_date,

    items.price,
    items.freight_value,
    
    -- Distribute payment value across items (simple approximation)
    -- total payment value / items count... but simple here is taking item price + freight
    (items.price + items.freight_value) AS payment_value,

    reviews.review_score,

    -- Delivery Metrics
    EXTRACT(DAY FROM (orders.delivered_customer_date - orders.purchase_timestamp))::integer AS actual_delivery_days,
    EXTRACT(DAY FROM (orders.estimated_delivery_date - orders.purchase_timestamp))::integer AS estimated_delivery_days,
    EXTRACT(DAY FROM (orders.delivered_customer_date - orders.estimated_delivery_date))::integer AS delivery_delay_days,
    
    CASE 
        WHEN orders.delivered_customer_date <= orders.estimated_delivery_date THEN TRUE 
        ELSE FALSE 
    END AS is_on_time

FROM items
LEFT JOIN orders ON items.order_id = orders.order_id
LEFT JOIN payments ON items.order_id = payments.order_id
LEFT JOIN reviews ON items.order_id = reviews.order_id
