{{ config(materialized='table') }}

WITH dates AS (
  SELECT
    generate_series(
      '2016-01-01'::timestamp,
      '2019-12-31'::timestamp,
      '1 day'::interval
    )::date AS full_date
)

SELECT
  TO_CHAR(full_date, 'YYYYMMDD')::integer AS date_key,
  full_date,
  EXTRACT(DAY FROM full_date)::integer AS day,
  EXTRACT(MONTH FROM full_date)::integer AS month,
  TO_CHAR(full_date, 'Mon') AS month_name,
  EXTRACT(QUARTER FROM full_date)::integer AS quarter,
  EXTRACT(YEAR FROM full_date)::integer AS year,
  EXTRACT(ISODOW FROM full_date)::integer AS day_of_week,
  TO_CHAR(full_date, 'Dy') AS day_name,
  CASE WHEN EXTRACT(ISODOW FROM full_date) IN (6, 7) THEN TRUE ELSE FALSE END AS is_weekend,
  EXTRACT(WEEK FROM full_date)::integer AS week_of_year
FROM dates
