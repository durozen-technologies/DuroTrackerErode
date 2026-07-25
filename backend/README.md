# Broiler 360 API

FastAPI backend for purchase, sales, expenses, inventory, dashboard, and reports.

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --port 8000
uv run pytest -q
```

App package lives under `app/`. One-off DB scratch scripts are not kept in-repo — use Alembic migrations and `tests/`.

## Tests

```bash
uv run pytest -q                 # all
uv run pytest -m unit -q         # InventoryService + math
uv run pytest -m integration -q  # ORM flows
uv run pytest -m api -q          # FastAPI httpx ASGI client
```

See [tests/README.md](tests/README.md).
