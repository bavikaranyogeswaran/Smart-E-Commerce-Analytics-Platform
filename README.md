# Smart E-Commerce Analytics Platform 🚀

An end-to-end data analytics platform built using the [Olist Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce). This project simulates a production-grade data stack, featuring automated ETL pipelines, dimensional modeling, a RESTful API, and a React dashboard.

## 🏗️ Architecture

1. **Airflow (Orchestration & ETL)**: Extracts raw CSV files, performs initial cleaning with `pandas`, and loads data into a PostgreSQL staging area.
2. **PostgreSQL (Data Warehouse)**: Houses the `staging` schema (raw tables) and the `warehouse` schema (Star Schema + KPI Marts).
3. **dbt (Transformation)**: Transforms staging data into a Kimball-style Star Schema (`fact_orders`, dimensions) and builds aggregated data marts (`revenue_summary`, `customer_rfm`, `delivery_performance`).
4. **FastAPI (Backend)**: Provides high-performance RESTful API endpoints connected to the data warehouse.
5. **Vite + React (Frontend)**: A modern, glassmorphism-styled dashboard built with **TypeScript**, Recharts, and Lucide icons to visualize the analytical data.
6. **Power BI (BI Layer)**: Instructions and DAX measures provided for enterprise reporting.

---

## 🛠️ Tech Stack

- **Data Engineering**: Python, Pandas, Apache Airflow, PostgreSQL, dbt
- **Backend API**: Python, FastAPI, SQLAlchemy, Pydantic
- **Frontend Dashboard**: React, TypeScript, Vite, Recharts, CSS Modules
- **Infrastructure**: Docker, Docker Compose

---

## 🚀 Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for running the React frontend)
- Python 3.11+

### 2. Environment Setup
Rename `.env.example` to `.env`. (Add your Kaggle API credentials if downloading data).

### 3. Download the Data
```bash
python data/download_dataset.py
```

### 4. Start the Backend Infrastructure
```bash
cd docker
docker-compose up -d
```

### 5. Run the ETL Pipeline (Airflow)
1. Go to **http://localhost:8080** (Login: `admin` / `admin123`)
2. Trigger the `olist_etl_pipeline` DAG.
3. This extracts the CSVs, loads them into Postgres Staging, and triggers `dbt` to build the Star Schema and Marts.

### 6. Start the React Frontend Dashboard
```bash
cd frontend-react
npm install
npm run dev
```
Navigate to **http://localhost:3000** to view your Smart Analytics Dashboard!

---

## ✨ Features Implemented
- **Automated Data Ingestion**: Seamless Kaggle API integration.
- **Star Schema Design**: Optimized `fact_orders` surrounded by robust dimensions.
- **RFM Customer Segmentation**: Pre-calculated customer value tiering.
- **Delivery Performance Tracking**: Geographic analysis of estimated vs actual delivery times.
- **Strictly Typed Glassmorphic UI**: Beautiful dark-mode dashboard tailored for e-commerce KPIs, built entirely in TypeScript.
