SELECT
    order_id,
    payment_sequential,
    payment_type,
    payment_installments,
    payment_value::numeric(12,2) AS payment_value
FROM {{ source('staging', 'order_payments') }}
WHERE order_id IS NOT NULL
