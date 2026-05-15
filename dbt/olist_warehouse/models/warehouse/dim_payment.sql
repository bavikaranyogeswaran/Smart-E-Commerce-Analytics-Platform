{{ config(materialized='table') }}

-- Payment is at order level, but can be split into installments
-- To create a dimension, we can treat each order's payment sequence as a unique key
SELECT
    {{ dbt_utils.generate_surrogate_key(['order_id', 'payment_sequential']) }} AS payment_key,
    order_id,
    payment_sequential,
    payment_type,
    payment_installments,
    payment_value
FROM {{ ref('stg_order_payments') }}
