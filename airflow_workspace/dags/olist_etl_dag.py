"""
================================================================
FILE: airflow_workspace/dags/olist_etl_dag.py
PURPOSE: Main Airflow DAG for extracting, cleaning, and loading
         Olist e-commerce dataset into PostgreSQL staging schema.
================================================================
"""

import os
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import create_engine
import numpy as np

from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.bash import BashOperator

# ── Paths & Connections ───────────────────────────────────────
# In Docker, we mounted the data/ folder to /opt/airflow/data
RAW_DATA_DIR = "/opt/airflow/data/raw"
# The connection string to our warehouse
DB_CONN = os.environ.get("AIRFLOW__DATABASE__SQL_ALCHEMY_CONN", "postgresql://olist_admin:olist_secret_2024@postgres:5432/olist_dw")

# Mapping of CSV files to staging tables
TABLE_MAPPING = {
    "olist_orders_dataset.csv": "orders",
    "olist_customers_dataset.csv": "customers",
    "olist_order_items_dataset.csv": "order_items",
    "olist_order_payments_dataset.csv": "order_payments",
    "olist_order_reviews_dataset.csv": "order_reviews",
    "olist_products_dataset.csv": "products",
    "olist_sellers_dataset.csv": "sellers",
    "olist_geolocation_dataset.csv": "geolocation",
    "product_category_name_translation.csv": "product_category_translation",
}

# ── ETL Functions ─────────────────────────────────────────────

def check_data_files(**kwargs):
    """Check if all raw CSV files exist. Skip if not."""
    missing_files = []
    for csv_file in TABLE_MAPPING.keys():
        file_path = os.path.join(RAW_DATA_DIR, csv_file)
        if not os.path.exists(file_path):
            missing_files.append(csv_file)
    
    if missing_files:
        print(f"Missing files: {missing_files}")
        return 'skip_pipeline'  # Points to a dummy/skip task if we had one
    
    return 'extract_clean_load'


def extract_clean_load(**kwargs):
    """
    Extracts data from CSVs, applies minimal cleaning (deduplication,
    datetime parsing, handling NA values), and loads directly into
    PostgreSQL staging schema using Pandas.
    """
    print(f"Connecting to database at {DB_CONN.split('@')[1]}")
    engine = create_engine(DB_CONN)
    
    for csv_file, table_name in TABLE_MAPPING.items():
        file_path = os.path.join(RAW_DATA_DIR, csv_file)
        print(f"\nProcessing {csv_file} -> staging.{table_name}")
        
        # Read CSV
        df = pd.read_csv(file_path)
        print(f"  Loaded {len(df)} rows")
        
        # Apply specific cleaning rules based on table
        if table_name == "orders":
            # Convert timestamp columns
            ts_cols = [
                'order_purchase_timestamp', 'order_approved_at', 
                'order_delivered_carrier_date', 'order_delivered_customer_date', 
                'order_estimated_delivery_date'
            ]
            for col in ts_cols:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                
            # Drop rows with no order_id (critical PK)
            df = df.dropna(subset=['order_id'])
            
        elif table_name == "order_reviews":
            # Convert timestamps
            ts_cols = ['review_creation_date', 'review_answer_timestamp']
            for col in ts_cols:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                
        elif table_name == "geolocation":
            # Geolocation has duplicate zip codes. We just want one distinct mapping 
            # for dimension joining later, though we can load all into staging
            # However, for efficiency and to avoid primary key issues down the line,
            # let's drop exact duplicates.
            df = df.drop_duplicates()
            
        elif table_name == "order_items":
            df['shipping_limit_date'] = pd.to_datetime(df['shipping_limit_date'], errors='coerce')
        
        # Clean string columns: remove nasty characters and strip whitespace
        for col in df.select_dtypes(include=['object']).columns:
            # We don't want to convert everything to string if it's mixed, but for mostly strings:
            if table_name == "order_reviews" and col in ['review_comment_title', 'review_comment_message']:
                # Ensure comments are strings and handle NaNs
                df[col] = df[col].astype(str).replace('nan', np.nan)
        
        # Load to PostgreSQL (replace staging data completely on each run)
        print(f"  Loading into staging.{table_name}...")
        try:
            # We use if_exists='append' to keep the schema definition from our init scripts,
            # but we first TRUNCATE the table to ensure idempotency.
            with engine.begin() as conn:
                conn.exec_driver_sql(f"TRUNCATE TABLE staging.{table_name} CASCADE;")
                
            df.to_sql(
                name=table_name,
                schema='staging',
                con=engine,
                if_exists='append',
                index=False,
                method='multi',
                chunksize=10000
            )
            print("  Done.")
        except Exception as e:
            print(f"  [ERROR] Failed to load {table_name}: {e}")
            raise e

# ── DAG Definition ────────────────────────────────────────────

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'olist_etl_pipeline',
    default_args=default_args,
    description='Extract, clean, and load Olist data to staging and run dbt',
    schedule_interval=timedelta(days=1),
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['olist', 'etl', 'dbt'],
) as dag:

    # 1. Check if files exist
    check_files_task = BranchPythonOperator(
        task_id='check_data_files',
        python_callable=check_data_files,
    )

    # 2. Extract, clean, and load to PostgreSQL
    etl_task = PythonOperator(
        task_id='extract_clean_load',
        python_callable=extract_clean_load,
    )
    
    # 3. Dummy task for skipped pipeline
    skip_pipeline = BashOperator(
        task_id='skip_pipeline',
        bash_command='echo "Raw data files missing. Skipping pipeline."',
    )
    
    # 4. Trigger dbt models (Warehouse -> Marts)
    # Note: dbt project is mounted at /opt/airflow/dbt/olist_warehouse
    run_dbt_task = BashOperator(
        task_id='run_dbt_models',
        bash_command='cd /opt/airflow/dbt/olist_warehouse && dbt deps && dbt run --profiles-dir .',
    )
    
    # 5. Run dbt tests
    test_dbt_task = BashOperator(
        task_id='run_dbt_tests',
        bash_command='cd /opt/airflow/dbt/olist_warehouse && dbt deps && dbt test --profiles-dir .',
    )

    # Define DAG dependencies
    check_files_task >> [etl_task, skip_pipeline]
    etl_task >> run_dbt_task >> test_dbt_task
