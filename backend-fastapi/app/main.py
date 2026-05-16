from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Smart E-Commerce Analytics API",
    description="Backend API for the Olist E-Commerce Analytics Dashboard",
    version="1.0.0"
)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], # React/Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Route
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Smart E-Commerce Analytics API",
        "version": "1.0.0"
    }

# Database Health Check Route
@app.get("/health/db")
def check_db(db: Session = Depends(get_db)):
    try:
        # Simple query to verify DB connection
        result = db.execute(text("SELECT 1")).scalar()
        return {"status": "ok", "database": "connected", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Note: In the next steps, we will include the routers for kpis, customers, products, etc.
# example: app.include_router(kpis.router, prefix="/kpis", tags=["KPIs"])
