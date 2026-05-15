-- Geolocation data has multiple lat/long points for the same zip code.
-- We aggregate to find the average lat/long per zip code to ensure a 1:1 join.
SELECT
    geolocation_zip_code_prefix AS zip_code_prefix,
    MAX(geolocation_city) AS city,
    MAX(geolocation_state) AS state,
    AVG(geolocation_lat)::numeric(12,8) AS latitude,
    AVG(geolocation_lng)::numeric(12,8) AS longitude
FROM {{ source('staging', 'geolocation') }}
GROUP BY 1
