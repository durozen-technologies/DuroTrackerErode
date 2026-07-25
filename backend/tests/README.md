# Backend tests

Three layers, all runnable with:

```bash
cd backend
uv run pytest -q
```

| Layer | Path | Client / fixture | Purpose |
|-------|------|------------------|---------|
| **Unit** | `tests/unit/` | `db_session` | InventoryService, bill math |
| **Integration** | `tests/integration/` | `db_session` | ORM multi-model stock + balance flow |
| **API** | `tests/api/` | FastAPI ASGI + `httpx.AsyncClient` | HTTP contracts |

Markers: `@pytest.mark.unit` · `@pytest.mark.integration` · `@pytest.mark.api`

```bash
uv run pytest -m unit -q
uv run pytest -m integration -q
uv run pytest -m api -q
```

Requires PostgreSQL (`TEST_POSTGRES_DB` in `.env`). If Postgres is down, tests auto-fall back to in-memory SQLite (`aiosqlite`). Override with `TEST_DATABASE_URL=...`.
