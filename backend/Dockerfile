FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2, uv, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
RUN pip install uv

# Copy only the files needed for installing dependencies
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --no-dev --frozen

# Copy the rest of the application code
COPY . .

# Copy the start script and make it executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8000

# Use the start script to run migrations and start the app
CMD ["/start.sh"]
