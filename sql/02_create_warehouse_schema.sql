-- ============================================================
-- FILE: sql/02_create_warehouse_schema.sql
-- PURPOSE: Creates the warehouse schema with star schema tables.
--          dbt models will populate these tables via transformations.
--          Schema is created here so dbt can reference it.
-- ============================================================

-- Step 1: Create warehouse schema (analytics layer)
CREATE SCHEMA IF NOT EXISTS warehouse;

-- ─────────────────────────────────────────────
-- DIMENSION TABLE: warehouse.dim_date
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.dim_date (
    date_key        INTEGER         PRIMARY KEY,   -- YYYYMMDD format
    full_date       DATE            NOT NULL,
    day             SMALLINT        NOT NULL,
    month           SMALLINT        NOT NULL,
    month_name      VARCHAR(12)     NOT NULL,
    quarter         SMALLINT        NOT NULL,
    year            SMALLINT        NOT NULL,
    day_of_week     SMALLINT        NOT NULL,
    day_name        VARCHAR(12)     NOT NULL,
    is_weekend      BOOLEAN         NOT NULL DEFAULT FALSE,
    week_of_year    SMALLINT
);

CREATE INDEX IF NOT EXISTS idx_dim_date_full_date ON warehouse.dim_date (full_date);
CREATE INDEX IF NOT EXISTS idx_dim_date_year_month ON warehouse.dim_date (year, month);

-- ─────────────────────────────────────────────
-- DIMENSION TABLE: warehouse.dim_customer
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.dim_customer (
    customer_key            SERIAL          PRIMARY KEY,
    customer_id             VARCHAR(50)     NOT NULL,   -- order-level ID (FK to orders)
    customer_unique_id      VARCHAR(50)     NOT NULL,   -- entity-level ID (real customer)
    zip_code_prefix         VARCHAR(10),
    city                    VARCHAR(100),
    state                   CHAR(2),
    latitude                NUMERIC(12, 8),
    longitude               NUMERIC(12, 8),
    UNIQUE (customer_id)
);

CREATE INDEX IF NOT EXISTS idx_dim_customer_unique_id ON warehouse.dim_customer (customer_unique_id);
CREATE INDEX IF NOT EXISTS idx_dim_customer_state     ON warehouse.dim_customer (state);

-- ─────────────────────────────────────────────
-- DIMENSION TABLE: warehouse.dim_product
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.dim_product (
    product_key                 SERIAL          PRIMARY KEY,
    product_id                  VARCHAR(50)     NOT NULL UNIQUE,
    category_name               VARCHAR(100),
    category_name_english       VARCHAR(100),
    product_name_length         INTEGER,
    product_description_length  INTEGER,
    photos_qty                  INTEGER,
    weight_g                    NUMERIC(10, 2),
    length_cm                   NUMERIC(10, 2),
    height_cm                   NUMERIC(10, 2),
    width_cm                    NUMERIC(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_dim_product_category ON warehouse.dim_product (category_name_english);

-- ─────────────────────────────────────────────
-- DIMENSION TABLE: warehouse.dim_seller
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.dim_seller (
    seller_key          SERIAL          PRIMARY KEY,
    seller_id           VARCHAR(50)     NOT NULL UNIQUE,
    zip_code_prefix     VARCHAR(10),
    city                VARCHAR(100),
    state               CHAR(2),
    latitude            NUMERIC(12, 8),
    longitude           NUMERIC(12, 8)
);

CREATE INDEX IF NOT EXISTS idx_dim_seller_state ON warehouse.dim_seller (state);

-- ─────────────────────────────────────────────
-- DIMENSION TABLE: warehouse.dim_geolocation
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.dim_geolocation (
    geo_key             SERIAL          PRIMARY KEY,
    zip_code_prefix     VARCHAR(10)     NOT NULL UNIQUE,
    latitude            NUMERIC(12, 8),
    longitude           NUMERIC(12, 8),
    city                VARCHAR(100),
    state               CHAR(2)
);

-- ─────────────────────────────────────────────
-- DIMENSION TABLE: warehouse.dim_payment
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.dim_payment (
    payment_key             SERIAL          PRIMARY KEY,
    order_id                VARCHAR(50)     NOT NULL,
    payment_sequential      INTEGER         NOT NULL,
    payment_type            VARCHAR(30),
    payment_installments    INTEGER,
    payment_value           NUMERIC(12, 2),
    UNIQUE (order_id, payment_sequential)
);

CREATE INDEX IF NOT EXISTS idx_dim_payment_order_id ON warehouse.dim_payment (order_id);
CREATE INDEX IF NOT EXISTS idx_dim_payment_type     ON warehouse.dim_payment (payment_type);

-- ─────────────────────────────────────────────
-- FACT TABLE: warehouse.fact_orders
-- Grain: one row per order item
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse.fact_orders (
    fact_key                SERIAL          PRIMARY KEY,
    order_id                VARCHAR(50)     NOT NULL,
    order_item_id           INTEGER         NOT NULL,

    -- Foreign keys to dimensions
    customer_key            INTEGER         REFERENCES warehouse.dim_customer (customer_key),
    product_key             INTEGER         REFERENCES warehouse.dim_product (product_key),
    seller_key              INTEGER         REFERENCES warehouse.dim_seller (seller_key),
    date_key                INTEGER         REFERENCES warehouse.dim_date (date_key),
    payment_key             INTEGER         REFERENCES warehouse.dim_payment (payment_key),

    -- Order status
    order_status            VARCHAR(20),

    -- Timestamps
    purchase_timestamp      TIMESTAMP,
    approved_at             TIMESTAMP,
    delivered_carrier_date  TIMESTAMP,
    delivered_customer_date TIMESTAMP,
    estimated_delivery_date TIMESTAMP,

    -- Measures
    price                   NUMERIC(12, 2),
    freight_value           NUMERIC(12, 2),
    payment_value           NUMERIC(12, 2),
    review_score            SMALLINT,

    -- Derived delivery metrics
    actual_delivery_days    INTEGER,        -- delivered_customer_date - purchase_timestamp
    estimated_delivery_days INTEGER,        -- estimated_delivery_date - purchase_timestamp
    delivery_delay_days     INTEGER,        -- actual vs estimated (positive = late)
    is_on_time              BOOLEAN,

    UNIQUE (order_id, order_item_id)
);

-- Indexes for common analytical queries
CREATE INDEX IF NOT EXISTS idx_fact_orders_order_id         ON warehouse.fact_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_fact_orders_customer_key     ON warehouse.fact_orders (customer_key);
CREATE INDEX IF NOT EXISTS idx_fact_orders_product_key      ON warehouse.fact_orders (product_key);
CREATE INDEX IF NOT EXISTS idx_fact_orders_date_key         ON warehouse.fact_orders (date_key);
CREATE INDEX IF NOT EXISTS idx_fact_orders_order_status     ON warehouse.fact_orders (order_status);
CREATE INDEX IF NOT EXISTS idx_fact_orders_purchase_ts      ON warehouse.fact_orders (purchase_timestamp);

-- ─────────────────────────────────────────────
-- KPI MART TABLES (populated by dbt marts)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse.revenue_summary (
    summary_key         SERIAL          PRIMARY KEY,
    period_date         DATE            NOT NULL,
    year                SMALLINT,
    month               SMALLINT,
    month_name          VARCHAR(12),
    state               CHAR(2),
    category_english    VARCHAR(100),
    total_revenue       NUMERIC(15, 2),
    total_orders        INTEGER,
    total_items         INTEGER,
    avg_order_value     NUMERIC(12, 2),
    total_freight       NUMERIC(12, 2)
);

CREATE INDEX IF NOT EXISTS idx_revenue_summary_date  ON warehouse.revenue_summary (period_date);
CREATE INDEX IF NOT EXISTS idx_revenue_summary_state ON warehouse.revenue_summary (state);

CREATE TABLE IF NOT EXISTS warehouse.customer_rfm (
    rfm_key             SERIAL          PRIMARY KEY,
    customer_unique_id  VARCHAR(50)     NOT NULL UNIQUE,
    city                VARCHAR(100),
    state               CHAR(2),
    last_purchase_date  DATE,
    recency_days        INTEGER,
    frequency           INTEGER,
    monetary_value      NUMERIC(15, 2),
    avg_review_score    NUMERIC(3, 2),
    rfm_segment         VARCHAR(30)     -- 'High Value', 'Mid Value', 'Low Value', 'Churned'
);

CREATE TABLE IF NOT EXISTS warehouse.delivery_performance (
    dp_key              SERIAL          PRIMARY KEY,
    state               CHAR(2),
    category_english    VARCHAR(100),
    year                SMALLINT,
    month               SMALLINT,
    total_orders        INTEGER,
    avg_actual_days     NUMERIC(6, 2),
    avg_estimated_days  NUMERIC(6, 2),
    on_time_count       INTEGER,
    late_count          INTEGER,
    on_time_rate        NUMERIC(5, 4)
);

-- ─────────────────────────────────────────────
-- Metadata comments
-- ─────────────────────────────────────────────
COMMENT ON SCHEMA warehouse IS 'Star schema warehouse — populated by dbt transformations';
COMMENT ON TABLE warehouse.fact_orders IS 'Central fact table: one row per order line item';
COMMENT ON TABLE warehouse.dim_date    IS 'Date dimension with calendar attributes';
COMMENT ON TABLE warehouse.customer_rfm IS 'RFM segmentation mart: recency, frequency, monetary';
COMMENT ON TABLE warehouse.delivery_performance IS 'Delivery KPI mart: on-time rate by state/category';
