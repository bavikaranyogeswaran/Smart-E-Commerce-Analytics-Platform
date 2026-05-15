# ============================================================
# Airflow Dockerfile
# Extends the official Airflow image with extra Python packages
# needed by the ETL DAG (pandas, psycopg2-binary, etc.)
# ============================================================
FROM apache/airflow:2.8.1-python3.11

USER root

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER airflow

# Install Python packages needed by the DAG
COPY requirements.txt /opt/airflow/requirements.txt
RUN pip install --no-cache-dir -r /opt/airflow/requirements.txt
