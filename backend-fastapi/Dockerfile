# ============================================================
# FastAPI Dockerfile
# ============================================================
FROM python:3.11-slim

# Create a non-root user
RUN adduser --disabled-password --gecos "" appuser

WORKDIR /app

# Create a virtual environment and make it the active Python/pip
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app /app/app

# Change ownership of the app directory to the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
