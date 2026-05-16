from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create database engine
# We use echo=False for production, but True can be helpful for debugging
engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True, # Verify connections before using them
    pool_size=5,
    max_overflow=10
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models (if we need ORM mappings, though we'll mostly use raw SQL for analytics)
Base = declarative_base()

def get_db():
    """
    Dependency function to get a database session.
    Yields the session and ensures it is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
