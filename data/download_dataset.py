"""
================================================================
FILE: data/download_dataset.py
PURPOSE: Download the Olist Brazilian E-Commerce dataset from
         Kaggle and extract CSVs to data/raw/ directory.
USAGE:
    Option A (Kaggle API):
        1. Set KAGGLE_USERNAME and KAGGLE_KEY in .env
        2. Run: python data/download_dataset.py

    Option B (Manual):
        1. Download from: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
        2. Extract all CSVs into: data/raw/
================================================================
"""

import os
import sys
import zipfile
import shutil
from pathlib import Path

# ── Root paths ────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
RAW_DATA_DIR = SCRIPT_DIR / "raw"
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── Expected CSV files from the Olist dataset ─────────────────
EXPECTED_FILES = [
    "olist_orders_dataset.csv",
    "olist_customers_dataset.csv",
    "olist_order_items_dataset.csv",
    "olist_order_payments_dataset.csv",
    "olist_order_reviews_dataset.csv",
    "olist_products_dataset.csv",
    "olist_sellers_dataset.csv",
    "olist_geolocation_dataset.csv",
    "product_category_name_translation.csv",
]

DATASET_SLUG = "olistbr/brazilian-ecommerce"


def check_existing_files() -> list:
    """Return list of missing CSV files."""
    missing = []
    for fname in EXPECTED_FILES:
        if not (RAW_DATA_DIR / fname).exists():
            missing.append(fname)
    return missing


def download_via_kaggle_api():
    """Download dataset using the kaggle Python package."""
    try:
        import kaggle  # noqa: F401
    except ImportError:
        print("[INFO] Installing kaggle package...")
        os.system(f"{sys.executable} -m pip install kaggle --quiet")
        import kaggle  # noqa: F401

    # Attempt to load credentials from .env
    env_file = SCRIPT_DIR.parent / ".env"
    if env_file.exists():
        print("[INFO] Loading Kaggle credentials from .env")
        for line in env_file.read_text().splitlines():
            if line.startswith("KAGGLE_"):
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

    kaggle_user = os.environ.get("KAGGLE_USERNAME")
    kaggle_key  = os.environ.get("KAGGLE_KEY")

    if not kaggle_user or not kaggle_key or kaggle_user == "your_kaggle_username":
        print("\n[ERROR] Kaggle credentials not configured.")
        print("        Set KAGGLE_USERNAME and KAGGLE_KEY in your .env file,")
        print("        or manually download the dataset (see below).\n")
        print_manual_instructions()
        sys.exit(1)

    # Write kaggle.json if not already present
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_dir.mkdir(exist_ok=True)
    kaggle_json = kaggle_dir / "kaggle.json"
    if not kaggle_json.exists():
        import json
        kaggle_json.write_text(
            json.dumps({"username": kaggle_user, "key": kaggle_key}),
            encoding="utf-8"
        )
        kaggle_json.chmod(0o600)
        print(f"[INFO] Created {kaggle_json}")

    print(f"[INFO] Downloading dataset: {DATASET_SLUG}")
    zip_path = RAW_DATA_DIR / "brazilian-ecommerce.zip"

    # Use kaggle CLI via subprocess for reliability
    import subprocess
    result = subprocess.run(
        [
            sys.executable, "-m", "kaggle", "datasets", "download",
            "-d", DATASET_SLUG,
            "--path", str(RAW_DATA_DIR),
            "--force"
        ],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[ERROR] kaggle download failed:\n{result.stderr}")
        print_manual_instructions()
        sys.exit(1)

    print("[INFO] Download complete. Extracting...")
    zip_files = list(RAW_DATA_DIR.glob("*.zip"))
    if not zip_files:
        print("[ERROR] No zip file found after download.")
        sys.exit(1)

    for zf in zip_files:
        with zipfile.ZipFile(zf, "r") as z:
            z.extractall(RAW_DATA_DIR)
        zf.unlink()  # remove zip after extraction
        print(f"[INFO] Extracted: {zf.name}")


def print_manual_instructions():
    print("=" * 60)
    print("MANUAL DOWNLOAD INSTRUCTIONS")
    print("=" * 60)
    print("1. Open: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print("2. Click 'Download' (requires free Kaggle account)")
    print(f"3. Extract the ZIP contents into: {RAW_DATA_DIR.resolve()}")
    print("\nExpected files:")
    for f in EXPECTED_FILES:
        print(f"   - {f}")
    print("=" * 60)


def verify_files():
    """Check all expected files exist and print their sizes."""
    print("\n[INFO] Verifying downloaded files...")
    all_ok = True
    for fname in EXPECTED_FILES:
        fpath = RAW_DATA_DIR / fname
        if fpath.exists():
            size_mb = fpath.stat().st_size / (1024 * 1024)
            print(f"   [OK] {fname:<55} {size_mb:>7.2f} MB")
        else:
            print(f"   [MISSING] {fname}")
            all_ok = False

    if all_ok:
        print("\n[SUCCESS] All dataset files are present. Ready for ETL pipeline.")
    else:
        print("\n[WARNING] Some files are missing. Re-run download or place files manually.")
        print_manual_instructions()
    return all_ok


def main():
    print("=" * 60)
    print("  Olist Dataset Download Utility")
    print("=" * 60)

    missing = check_existing_files()
    if not missing:
        print("[INFO] All dataset files already exist in data/raw/")
        verify_files()
        return

    print(f"[INFO] Missing {len(missing)} file(s). Attempting Kaggle API download...")

    # Check if kaggle credentials are available
    kaggle_user = os.environ.get("KAGGLE_USERNAME", "")
    if not kaggle_user or kaggle_user == "your_kaggle_username":
        # Try reading from .env
        env_file = SCRIPT_DIR.parent / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("KAGGLE_USERNAME="):
                    kaggle_user = line.split("=", 1)[1].strip()

    if not kaggle_user or kaggle_user == "your_kaggle_username":
        print("[INFO] Kaggle API not configured.")
        print_manual_instructions()
        sys.exit(0)

    download_via_kaggle_api()
    verify_files()


if __name__ == "__main__":
    main()
