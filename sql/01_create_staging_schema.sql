-- ============================================================
-- FILE: sql/01_create_staging_schema.sql
-- PURPOSE: Creates the staging schema and all raw ingestion tables
--          mirroring the Olist CSV file structures exactly.
-- RUNS: Automatically on first PostgreSQL container startup.
-- ============================================================

-- Step 1: Create staging schema (raw ingestion layer)
CREATE SCHEMA IF NOT EXISTS staging;

-- ─────────────────────────────────────────────
-- Table: staging.orders
-- Source: olist_orders_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.orders (
    order_id                        VARCHAR(50)  PRIMARY KEY,
    customer_id                     VARCHAR(50)  NOT NULL,
    order_status                    VARCHAR(20),
    order_purchase_timestamp        TIMESTAMP,
    order_approved_at               TIMESTAMP,
    order_delivered_carrier_date    TIMESTAMP,
    order_delivered_customer_date   TIMESTAMP,
    order_estimated_delivery_date   TIMESTAMP,
    _loaded_at                      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: staging.customers
-- Source: olist_customers_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.customers (
    customer_id                 VARCHAR(50) PRIMARY KEY,
    customer_unique_id          VARCHAR(50) NOT NULL,
    customer_zip_code_prefix    VARCHAR(10),
    customer_city               VARCHAR(100),
    customer_state              CHAR(2),
    _loaded_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: staging.order_items
-- Source: olist_order_items_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.order_items (
    order_id                VARCHAR(50)     NOT NULL,
    order_item_id           INTEGER         NOT NULL,
    product_id              VARCHAR(50)     NOT NULL,
    seller_id               VARCHAR(50)     NOT NULL,
    shipping_limit_date     TIMESTAMP,
    price                   NUMERIC(12, 2),
    freight_value           NUMERIC(12, 2),
    _loaded_at              TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (order_id, order_item_id)
);

-- ─────────────────────────────────────────────
-- Table: staging.order_payments
-- Source: olist_order_payments_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.order_payments (
    order_id                VARCHAR(50)     NOT NULL,
    payment_sequential      INTEGER         NOT NULL,
    payment_type            VARCHAR(30),
    payment_installments    INTEGER,
    payment_value           NUMERIC(12, 2),
    _loaded_at              TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (order_id, payment_sequential)
);

-- ─────────────────────────────────────────────
-- Table: staging.order_reviews
-- Source: olist_order_reviews_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.order_reviews (
    review_id               VARCHAR(50)     NOT NULL,
    order_id                VARCHAR(50)     NOT NULL,
    review_score            SMALLINT        CHECK (review_score BETWEEN 1 AND 5),
    review_comment_title    TEXT,
    review_comment_message  TEXT,
    review_creation_date    TIMESTAMP,
    review_answer_timestamp TIMESTAMP,
    _loaded_at              TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (review_id, order_id)
);

-- ─────────────────────────────────────────────
-- Table: staging.products
-- Source: olist_products_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.products (
    product_id                  VARCHAR(50) PRIMARY KEY,
    product_category_name       VARCHAR(100),
    product_name_lenght         INTEGER,
    product_description_lenght  INTEGER,
    product_photos_qty          INTEGER,
    product_weight_g            NUMERIC(10, 2),
    product_length_cm           NUMERIC(10, 2),
    product_height_cm           NUMERIC(10, 2),
    product_width_cm            NUMERIC(10, 2),
    _loaded_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: staging.sellers
-- Source: olist_sellers_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.sellers (
    seller_id               VARCHAR(50) PRIMARY KEY,
    seller_zip_code_prefix  VARCHAR(10),
    seller_city             VARCHAR(100),
    seller_state            CHAR(2),
    _loaded_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: staging.geolocation
-- Source: olist_geolocation_dataset.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.geolocation (
    geolocation_id              SERIAL PRIMARY KEY,
    geolocation_zip_code_prefix VARCHAR(10)     NOT NULL,
    geolocation_lat             NUMERIC(12, 8),
    geolocation_lng             NUMERIC(12, 8),
    geolocation_city            VARCHAR(100),
    geolocation_state           CHAR(2),
    _loaded_at                  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_zip ON staging.geolocation (geolocation_zip_code_prefix);

-- ─────────────────────────────────────────────
-- Table: staging.product_category_translation
-- Source: product_category_name_translation.csv
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging.product_category_translation (
    product_category_name           VARCHAR(100) PRIMARY KEY,
    product_category_name_english   VARCHAR(100),
    _loaded_at                      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes for join performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_customer_id       ON staging.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status            ON staging.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_purchase_ts       ON staging.orders (order_purchase_timestamp);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id   ON staging.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id    ON staging.order_items (seller_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id  ON staging.order_payments (order_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_order_id   ON staging.order_reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_customers_unique_id      ON staging.customers (customer_unique_id);

-- Done
COMMENT ON SCHEMA staging IS 'Raw CSV ingestion layer — populated by Airflow ETL pipeline';
