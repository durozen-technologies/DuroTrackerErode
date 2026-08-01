#!/bin/bash
set -e

# Run Alembic migrations
echo "Running database migrations..."
uv run alembic upgrade head

# Start the FastAPI server
echo "Starting FastAPI server..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
