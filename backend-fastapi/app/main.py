"""
================================================================
FILE: app/main.py
PURPOSE: FastAPI application entry point.
         Registers all routers and configures CORS middleware.
================================================================
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.routers import kpis, sales, customers, products, delivery

# ── App Initialization ─────────────────────────────────────────
app = FastAPI(
    title="Smart E-Commerce Analytics API",
    description="""
## Olist E-Commerce Analytics Platform

This API serves analytical data from the Olist Brazilian E-Commerce dataset,
transformed via dbt into a star schema data warehouse.

### Available Endpoints

| Group | Endpoint | Description |
|-------|----------|-------------|
| KPIs | `GET /kpis/revenue` | Overall revenue, orders, avg order value |
| KPIs | `GET /kpis/orders` | Order counts broken down by status |
| Sales | `GET /sales/trends` | Daily / monthly / yearly revenue trends |
| Customers | `GET /customers/top` | Top N customers by spend |
| Customers | `GET /customers/rfm` | RFM segment distribution |
| Products | `GET /products/top` | Top N products by revenue |
| Products | `GET /products/categories` | Revenue by product category |
| Delivery | `GET /delivery/avg-time` | Overall average delivery time |
| Delivery | `GET /delivery/performance` | Delivery KPIs by Brazilian state |
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Create React App
        "http://localhost:5173",   # Vite
        "http://localhost:4173",   # Vite preview
        "*"                        # Allow all in development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────
app.include_router(kpis.router,      prefix="/kpis",      tags=["KPIs"])
app.include_router(sales.router,     prefix="/sales",     tags=["Sales"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(products.router,  prefix="/products",  tags=["Products"])
app.include_router(delivery.router,  prefix="/delivery",  tags=["Delivery"])


# ── Root Health Check ──────────────────────────────────────────
@app.get("/", tags=["Health"])
def read_root():
    return {
        "status": "online",
        "service": "Smart E-Commerce Analytics API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# ── Database Health Check ──────────────────────────────────────
@app.get("/health/db", tags=["Health"])
def check_db(db: Session = Depends(get_db)):
    """Verifies the database connection is alive."""
    try:
        result = db.execute(text("SELECT 1")).scalar()
        # Also count rows from the main fact table as a data-readiness check
        row_count = db.execute(
            text("SELECT COUNT(*) FROM warehouse.fact_orders")
        ).scalar()
        return {
            "status": "ok",
            "database": "connected",
            "warehouse_fact_orders_rows": row_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
