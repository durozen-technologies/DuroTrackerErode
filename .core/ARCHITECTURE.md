# BROILER 360 Architecture

## Architectural Changes Log
*Note: Each time the architecture changes, append the change in this section with a timestamp. NEVER overwrite the historical architecture.*

### [2026-07-21] Initial BROILER 360 Architecture Tracking

## Application Type
Single-tenant B2B application for Poultry Business Management (Wholesalers, Farms, Chicken Shops). Supports both Android Mobile (primary) and Desktop/Web (for office use).

## Stack Overview
- **Frontend (Mobile)**: React Native (Expo)
  - UI Styling: NativeWind / Tailwind CSS
  - State/Data Management: React Query, Zustand
  - Navigation: Expo Router / React Navigation
- **Frontend (Web)**: React
  - UI Styling: Tailwind CSS
  - Framework: Vite
- **Backend**: Python (FastAPI)
  - ORM: SQLAlchemy (Async)
  - Migrations: Alembic
  - Authentication: JWT (Single-tenant login)
- **Database**: PostgreSQL
  - Schema: Standard `public` schema.
- **CI/CD**: GitHub Actions
  - Workflows: Automated Android APK builds and web deployment

## Code Files & Folders Structure

```text
Layer-Brolier (Root)
├── .agents/
│   ├── .env
│   └── AGENTS.md
├── .core/
│   ├── ADMIN_PLAN.md
│   ├── AGENT_COMMANDS.md
│   ├── ARCHITECTURE.md
│   ├── CHAT_LOG.md
│   ├── DATA_MODELS.md
│   ├── IDEA.md
│   ├── RULES.md
│   ├── SESSION_HISTORY.md
│   └── TEST_CREDENTIALS.md
├── backend/          # FastAPI Python Backend
├── frontend_mobile/  # Expo React Native App
└── frontend_web/     # Vite React App (Planned)
```


### [2026-07-24 14:58:50] - New Architecture (Master-Detail)
Backend moved to a standard Master-Detail entity relation for transactions to support multi-item bills.
Inventory calculations are now driven by `InventoryService` interacting with a Master `Item` Catalog rather than being embedded inside individual purchase/sale columns.

### [2026-07-24 16:21:07] - Reports API + Spec-First Mobile Bills
- Added `reports` router for SQL-aggregated purchase/sales/inventory/expense/outstanding reports.
- Dashboard stats accept `date_from` / `date_to`.
- Mobile purchase/sale screens switched from broiler weighbridge UI to multi-item Kg/Unit bills.
- Added Items master and Notifications (low-stock) stack screens.

### [2026-07-24 16:28:32] - Repo hygiene
- Removed ad-hoc backend/root scratch scripts; documented layout in root `README.md`.
- Shared Pydantic contracts under `app/schemas`; mobile API helpers under `src/api/resources.ts`.
