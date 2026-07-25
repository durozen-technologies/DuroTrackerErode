"""Shared pytest fixtures for Broiler 360 backend tests.

Layers:
  unit/         — service / pure logic (uses db_session)
  integration/  — multi-model DB flows (uses db_session)
  api/          — HTTP via FastAPI ASGI + httpx AsyncClient

Database:
  Prefers PostgreSQL (TEST_POSTGRES_DB). Falls back to in-memory SQLite
  when Postgres is unreachable so the suite still runs locally.
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool

from app import models  # noqa: F401 — register metadata
from app.core.config import settings
from app.db.database import Base, get_db
from app.main import app


def _resolve_test_db_url() -> tuple[str, dict]:
    """Return (url, engine_kwargs)."""
    forced = os.getenv("TEST_DATABASE_URL")
    if forced:
        return forced, {"poolclass": NullPool}

    # Prefer Postgres when configured and reachable
    pg_url = settings.async_test_database_url
    if settings.TEST_POSTGRES_DB:
        try:
            import socket

            sock = socket.create_connection(
                (settings.POSTGRES_SERVER, int(settings.POSTGRES_PORT)),
                timeout=1,
            )
            sock.close()
            return pg_url, {"poolclass": NullPool}
        except OSError:
            pass

    # SQLite in-memory fallback (shared cache across connections)
    return (
        "sqlite+aiosqlite:///:memory:",
        {
            "poolclass": StaticPool,
            "connect_args": {"check_same_thread": False},
        },
    )


@pytest_asyncio.fixture
async def engine():
    url, kwargs = _resolve_test_db_url()
    eng = create_async_engine(url, echo=False, **kwargs)

    async with eng.begin() as conn:
        if url.startswith("postgresql"):
            await conn.execute(text("DROP SCHEMA public CASCADE"))
            await conn.execute(text("CREATE SCHEMA public"))
        else:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """DB session for unit + integration tests (no HTTP)."""
    Session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with Session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(engine) -> AsyncGenerator[AsyncClient, None]:
    """FastAPI test client (httpx AsyncClient over ASGITransport)."""
    Session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app, raise_app_exceptions=True)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
