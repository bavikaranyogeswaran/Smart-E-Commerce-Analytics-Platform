"""
================================================================
FILE: scripts/init_db.py
PURPOSE: Standalone script to initialize the PostgreSQL database.
         Runs the staging and warehouse SQL schemas directly
         (useful when not using Docker auto-init).
USAGE:
    1. Ensure PostgreSQL is running (docker compose up postgres -d)
    2. Copy .env.example to .env and configure credentials
    3. Run: python scripts/init_db.py
================================================================
"""

import os
import sys
import psycopg2
from pathlib import Path

# ── Load .env manually (no dotenv dependency needed) ──────────
def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())

load_env()

# ── DB Connection config ──────────────────────────────────────
DB_CONFIG = {
    "host":     os.environ.get("POSTGRES_HOST", "localhost"),
    "port":     int(os.environ.get("POSTGRES_PORT", 5432)),
    "dbname":   os.environ.get("POSTGRES_DB", "olist_dw"),
    "user":     os.environ.get("POSTGRES_USER", "olist_admin"),
    "password": os.environ.get("POSTGRES_PASSWORD", "olist_secret_2024"),
}

SQL_DIR = Path(__file__).parent.parent / "sql"
SQL_FILES = [
    "01_create_staging_schema.sql",
    "02_create_warehouse_schema.sql",
]


def run_sql_file(cursor, filepath: Path):
    print(f"[INFO] Executing: {filepath.name}")
    sql = filepath.read_text(encoding="utf-8")
    cursor.execute(sql)
    print(f"[OK]   {filepath.name} executed successfully")


def main():
    print("=" * 60)
    print("  Olist Database Initialization")
    print("=" * 60)
    print(f"[INFO] Connecting to PostgreSQL at {DB_CONFIG['host']}:{DB_CONFIG['port']}")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        print("[OK]   Connected to database")

        for sql_file in SQL_FILES:
            path = SQL_DIR / sql_file
            if not path.exists():
                print(f"[ERROR] SQL file not found: {path}")
                sys.exit(1)
            run_sql_file(cursor, path)

        cursor.close()
        conn.close()

        print("\n[SUCCESS] Database initialized successfully!")
        print("          Staging and warehouse schemas are ready.")
        print("          You can now run the Airflow ETL pipeline.")

    except psycopg2.OperationalError as e:
        print(f"\n[ERROR] Cannot connect to database: {e}")
        print("\nTroubleshooting:")
        print("  1. Is PostgreSQL running?  Run: docker compose -f docker/docker-compose.yml up postgres -d")
        print("  2. Are your .env credentials correct?")
        print(f"  3. Current config: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}")
        sys.exit(1)
    except psycopg2.Error as e:
        print(f"\n[ERROR] SQL execution failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
