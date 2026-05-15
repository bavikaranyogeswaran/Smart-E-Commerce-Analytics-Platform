-- In some cases, a single order can have multiple reviews.
-- We'll select the latest review per order for simplicity in our fact table.
WITH ranked_reviews AS (
    SELECT
        review_id,
        order_id,
        review_score,
        review_comment_title,
        review_comment_message,
        review_creation_date::timestamp AS review_creation_date,
        review_answer_timestamp::timestamp AS review_answer_timestamp,
        ROW_NUMBER() OVER(PARTITION BY order_id ORDER BY review_creation_date DESC) as rn
    FROM {{ source('staging', 'order_reviews') }}
    WHERE order_id IS NOT NULL
)
SELECT
    review_id,
    order_id,
    review_score,
    review_comment_title,
    review_comment_message,
    review_creation_date,
    review_answer_timestamp
FROM ranked_reviews
WHERE rn = 1
