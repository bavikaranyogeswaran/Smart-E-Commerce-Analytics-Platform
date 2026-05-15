# Smart E-Commerce Analytics Platform

An end-to-end data platform built using the Olist Brazilian E-Commerce dataset.

## Architecture

*   **Ingestion:** Python scripts to download raw data (Kaggle API).
*   **Storage:** PostgreSQL (Staging and Warehouse schemas).
*   **Orchestration:** Apache Airflow (Dockerized).
*   **Transformation:** dbt (Data Build Tool) building a star schema and KPI marts.
*   **Backend:** FastAPI providing REST endpoints to query the warehouse.
*   **Frontend:** React dashboard visualizing key metrics.
*   **BI:** Power BI dashboards for deep-dive analytics.

## Quick Start (Phase 1)

### Prerequisites

*   Docker Desktop installed and running.
*   Python 3.9+.

### Setup Environment

1.  Copy `.env.example` to `.env` and fill in your Kaggle API credentials if you have them.
    ```bash
    cp .env.example .env
    ```

2.  Start the infrastructure using Docker Compose:
    ```bash
    docker compose -f docker/docker-compose.yml --env-file .env up -d postgres airflow-init
    docker compose -f docker/docker-compose.yml --env-file .env up -d
    ```

3.  Download the dataset:
    ```bash
    python data/download_dataset.py
    ```

### Accessing Services

*   **Airflow UI:** `http://localhost:8080` (admin/admin123)
*   **PostgreSQL:** `localhost:5432` (olist_admin/olist_secret_2024)
