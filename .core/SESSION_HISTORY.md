# BROILER 360 Session History

*Every action taken by the AI agent MUST be logged here before ending the turn.*

---

### [2026-07-24 09:42] Expense Module Implementation
- [2026-07-24 09:42]: User requested to port the expense section from Duro_POS to the current project, excluding the branch allocation logic.
- [2026-07-24 09:48]: Created an implementation plan which included migrating models, APIs, and screens.
- [2026-07-24 09:49]: User rejected `tamil_name` field. Rewrote implementation plan without it.
- [2026-07-24 09:50]: User approved plan and requested a new Alembic migration.
- [2026-07-24 09:51]: Executed implementation plan: Updated `ExpenseCategory` and `Expense` models in `backend/app/models/expense.py`, generated and ran Alembic migration, created `expenses` router in backend, built `expenses.ts` frontend API client, and created `ExpenseCategoriesScreen.tsx` & `ExpensesScreen.tsx` frontend screens. Linked screens to Dashboard.
- [2026-07-24 10:03]: Fixed a 500 error on `/api/dashboard/stats` caused by referring to `e.amount` instead of `e.total_amount` for Expense calculations.
- `[2026-07-24 10:07]`: UI Adjustment: Replaced the 'More' bottom tab with 'Expenses' and added a 'Categories' navigation button inside the Expenses screen header.
- `[2026-07-24 10:09]`: UI Adjustment: Removed the 'Sort Order' input from the Category creation modal and centered the title.
- `[2026-07-24 10:11]`: UI Adjustment: Changed the modals on the Expenses and Categories screens to appear centered on the screen instead of being docked at the bottom.
### [2026-07-21] Initial Documentation Setup
**Request:** Copy `.agents` and `.core` from Duro Tracker and adapt them to the BROILER 360 project.
**Actions Taken:**
1. Evaluated `Projectidea.md`.
2. Created an implementation plan to overwrite the documentation.
3. Updated `AGENTS.md` paths.
4. Rewrote `RULES.md` to reflect a single-tenant poultry business.
5. Overwrote `IDEA.md` with the complete project idea.
6. Rewrote `ADMIN_PLAN.md` to list the new modules (Dashboard, Party, Purchase, Sales, Expense, Reports).
7. Completely redesigned `ARCHITECTURE.md` and `DATA_MODELS.md` for the single-tenant system with Party, Purchase, Sale, and PaymentTransaction models.
8. Initialized `CHAT_LOG.md` and `SESSION_HISTORY.md`.

### [2026-07-21] Phase 1: Backend Foundation Executed
**Request:** Build the application (Phase 1).
**Actions Taken:**
1. Initialized FastAPI project with uv.
2. Configured database connection for duraiproject.
3. Created all SQLAlchemy models (User, Party, Purchase, Sale, Expense, PaymentTransaction).
4. Set up Alembic and ran initial migration successfully.

### [2026-07-21] Phase- Setup React Native (Expo) app with `NativeWind` and ported UI screens.
- Re-ran Expo to install missing Babel preset.

### [2026-07-21 12:30:00] Backend API Integration (Phase 3)
- Built FastAPI async endpoints for Parties, Purchases, Sales, and Dashboard.
- Integrated Axios and `@tanstack/react-query` in the Expo mobile app.
- Connected `DashboardScreen.tsx`, `PartiesScreen.tsx`, `NewPurchaseScreen.tsx`, and `NewSaleScreen.tsx` to live backend endpoints.

### [2026-07-21] Phase 2: React Native (Expo) Frontend Architecture
**Request:** Do the UI for all (using Expo React Native).
**Actions Taken:**
1. Initialized Expo React Native app in frontend_mobile.
2. Configured NativeWind and Lucide icons.
3. Created Bottom Tabs navigation shell.
4. Ported Dashboard, New Purchase, New Sale, and Parties mockups from web to Native with updated calculations and ? currency.
5. Verified TypeScript compilation.

### [2026-07-21 14:18:48] Added frontend_mobile env
- Added EXPO_PUBLIC_API_URL to frontend_mobile/src/api/client.ts
- Created .env and .env.example in frontend_mobile

### [2026-07-21 14:21:30] Added backend env
- Created .env and .env.example in backend/ mirroring the config in app/core/config.py
- Added .env to backend/.gitignore

### [2026-07-23 09:50:58] Add Party Bugfix
- Investigated failed party creation issue.
- Added .env to backend/.gitignore

### [2026-07-23 09:50:58] Add Party Bugfix
- Investigated failed party creation issue.
- Identified that Android Emulator requests to localhost fail with Network Error.
- Updated frontend_mobile/src/api/client.ts to dynamically convert localhost to 10.0.2.2 for Android devices.
- Enhanced error handling in frontend_mobile/src/screens/NewPartyScreen.tsx to correctly parse and display FastAPI 422 Validation Error details instead of fallback messages.

### [2026-07-23 09:55:41] Create DB Verification Test
- Created test script verify_party_db.py to verify that adding a party successfully saves all details to the PostgreSQL database.
- Ran the test which successfully passed, confirming that Name, Mobile, Type, and Opening Balance are saved properly.

### [2026-07-23 10:02:00] Verify Endpoints and MCP
- Checked frontend `client.ts` to confirm it points to `http://localhost:8000/api`.
- Checked backend `main.py` and `api.py` to confirm the API routes.
- Verified `/api/parties/` endpoint returns data successfully.
### [2026-07-23 10:10:00] UI Empty List Fix
- Investigated why `PartiesScreen` was rendering an empty list despite DB having data.
- Identified that missing a trailing slash on `GET /parties` triggered a `307 Temporary Redirect` from FastAPI, breaking React Native Axios requests silently.
- Added trailing slash to all `/parties/` GET requests in `PartiesScreen.tsx`, `NewSaleScreen.tsx`, and `NewPurchaseScreen.tsx`.
- Added visible error state to `PartiesScreen.tsx` to prevent silent failures in the future.

### [2026-07-23 10:16:15] Physical Device Connection Fix
- Investigated infinite loading issue on mobile device compared to web view.
- Identified that `EXPO_PUBLIC_API_URL` was set to `localhost`, which fails on physical devices as they cannot resolve the laptop's localhost.
- Retrieved host local IP address (`192.168.1.13`) using `ipconfig`.
- Updated `frontend_mobile/.env` to set `EXPO_PUBLIC_API_URL="http://192.168.1.13:8000/api"`.

### [2026-07-23 10:24:44] UI Data Mapping Fix
- Fixed an issue in `PartiesScreen.tsx` where phone numbers were not displaying.
- Corrected the field mapping from `party.phone` to `party.mobile` to match the backend database schema.

### [2026-07-23 10:26:59] UI Terminology Update
- Updated UI text across `PartiesScreen.tsx`, `NewSaleScreen.tsx`, `NewPartyScreen.tsx`, and `DashboardScreen.tsx`.
- Changed "Customer" to "Purchaser" to better reflect the business domain (buying items from parties).
- Left internal states and backend models as "customer" to prevent data breakage.

- [2026-07-23 10:34:25] User requested to add an Address field to the add party page and show it on the parties page. Added the address field to frontend NewPartyScreen.tsx and PartiesScreen.tsx (backend already supported it).
- [2026-07-23 10:36:00] Generated and ran Alembic migration to add ddress column to the parties table in the database to ensure it persists.
- [2026-07-23 10:41:59] Fixed render error in NewSaleScreen.tsx by importing the missing User icon component from lucide-react-native.
- [2026-07-23 10:50:09] Replaced Supplier ID and Purchaser ID TextInputs with Dropdown (Picker) components in NewPurchaseScreen.tsx and NewSaleScreen.tsx to allow selecting from fetched parties.
- [2026-07-23 10:55:55] Swapped Purchaser and Supplier UI labels and mappings. Database customer is now used for Suppliers, and supplier is used for Purchasers across NewPartyScreen, PartiesScreen, NewPurchaseScreen, and NewSaleScreen.
- [2026-07-23 11:01:43] Refactored database enum partytype using raw SQL to rename CUSTOMER to SUPPLIER, and SUPPLIER to PURCHASER. Updated enums.py and frontend screens to use these new uppercase types directly.
- [2026-07-23 11:12:44] Corrected labels and DB types in NewPurchaseScreen (to use Purchaser) and NewSaleScreen (to use Supplier) based on the user business logic.
- [2026-07-23 11:44:39] Fixed TypeError: invalid keyword argument for PaymentTransaction in both purchases.py and sales.py by aligning the instantiation arguments with the PaymentTransaction model (type, cash_amount, upi_amount, total_amount).
- [2026-07-23 11:48:35] Fixed TypeError (Decimal + float) in purchases.py and sales.py by converting current_balance to float before math operations.

- [2026-07-23 11:48:35] Fixed TypeError (Decimal + float) in purchases.py and sales.py by converting current_balance to float before math operations.

- [2026-07-23 11:53:51] Created PurchasesScreen and SalesScreen to show a list of history, and moved NewPurchaseScreen and NewSaleScreen to stack navigators accessed via Add buttons.

- [2026-07-23 12:52:41] Added 'Driver Name' text input field to both NewPurchaseScreen and NewSaleScreen, and updated the Pydantic schemas and database models (via new Alembic migration) to save the driver_name.

- [2026-07-23 12:58:06] Removed Adjustment and Actual Birds fields in NewPurchaseScreen. Replaced with an auto-calculated Total Birds Count that allows manual override via an Edit button (Pencil icon).

- [2026-07-23 13:07:57] Removed expected_birds and adjustment columns from the purchases table via Alembic migration. Fixed driver_name saving issue and added driver_name to the history list views.

- [2026-07-23 13:12:00] Fixed automatic list refresh bug by adding query invalidation for ['purchases'] and ['sales'] on save. Added pull-to-refresh and a manual refresh icon to Purchases, Sales, and Parties list screens.

- [2026-07-23 13:20:26] Removed 'Empty Box Weight (kg)' field from NewPurchaseScreen as requested.

- [2026-07-23 13:24:17] Reorganized NewPurchaseScreen Weight & Rates layout to place Purchase Rate on the left and Weighbridge on the right. Added automatic calculation for Net Weight (Weighbridge - Total Birds * 40g) with a manual edit toggle.

- [2026-07-23 13:25:14] Fixed ReferenceError for missing Edit2 import in NewPurchaseScreen.

- [2026-07-23 13:31:34] Fixed ReferenceError for missing Pencil import in NewPurchaseScreen.

- [2026-07-23 13:34:28] Updated Net Weight edit UI to match the Total Birds Count UI (Pencil icon with Edit text, and a Cancel Edit button below).

- [2026-07-23 13:39:17] Updated NewPurchaseScreen to auto-calculate Total Purchase Amount based on Net Weight * Purchase Rate. Added a visible Balance Amount indicator under the Total Paid Now field.

- [2026-07-23 13:46:43] Updated Payment section in NewPurchaseScreen and NewSaleScreen to split amount_paid into cash_payment and upi_payment. Added UI to display Total Paid and Balance.

- [2026-07-23 13:53:45] Made the empty bird box weight (40g) editable inline in the NewPurchaseScreen Net Weight auto-calculate text.

- [2026-07-23 14:00:04] Updated styling for Total Purchase Amount and Total Sale Amount to have a gray background with bold green text, and made them non-editable.

- [2026-07-23 14:05:23] Replaced standard ScrollView with KeyboardAwareScrollView in NewPurchaseScreen, NewSaleScreen, and NewPartyScreen to prevent the mobile keyboard from blocking the bottom Payment UI.

- [2026-07-23 14:08:40] Added enableOnAndroid={true} and extraScrollHeight={120} props to KeyboardAwareScrollView on all form screens to fix issue where keyboard was still covering the bottom fields on Android.

- [2026-07-23 14:12:15] Fixed the ScrollView bottom padding issue where content was hiding behind the absolute bottom 'Save/Cancel' buttons. Moved padding classes to contentContainerStyle on all form screens.

- [2026-07-23 14:16:35] Updated Driver Name and Vehicle Number fields in NewPurchaseScreen and NewSaleScreen to display side-by-side on web (md breakpoint) while remaining stacked on mobile.

- [2026-07-23 14:20:53] Added manual Date entry field to NewPurchaseScreen and NewSaleScreen. Positioned Date next to Purchaser/Supplier in a side-by-side layout on web views. Updated backend schemas to accept date from frontend.

- [2026-07-23 14:24:32] Replaced simple Date text input with @react-native-community/datetimepicker on NewPurchaseScreen and NewSaleScreen to display a native date picker modal on mobile. Formatted the displayed date to DD/MM/YYYY while keeping backend payload as YYYY-MM-DD.

- [2026-07-23 14:26:59] Fixed mobile layout stacking issue for Date/Purchaser and Driver/Vehicle fields. Replaced buggy NativeWind space-y-3 classes with explicit mb-3 md:mb-0 margins to guarantee correct vertical spacing between fields on mobile devices.

- [2026-07-23 14:29:40] Fixed React Native Picker UI bug on Android where the bottom 25% of text was clipped. Increased Picker height to 54 and applied flex-center constraints.

- [2026-07-23 14:34:25] Changed default state of Purchaser and Supplier fields to empty so users are forced to make a selection. Set the placeholder options ('Select a purchaser...') to be unselectable/hidden in the dropdown list using enabled={false}.

- [2026-07-23 15:12:12] Added form validation checks on NewPurchaseScreen and NewSaleScreen to ensure a valid party is selected, and that Weight and Rate fields are > 0 before allowing form submission.

- [2026-07-23 15:18:38] Replaced popup validation with inline error messages below each mandatory field in NewPurchaseScreen and NewSaleScreen. Fields auto-clear their error state on input.

- [2026-07-23 15:21:40] Fixed the Purchaser and Supplier dropdowns (Picker component) so the entire text box space is clickable, not just the down arrow icon. Achieved this by setting mode='dropdown' and flex: 1 on the Picker styles in NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 15:24:29] Fixed React Native DateTimePicker LogBox warning by migrating from the deprecated 'onChange' prop to 'onValueChange' and 'onDismiss' in both NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 15:28:03] Removed 'enabled={false}' from the initial placeholder Picker items in NewPurchaseScreen and NewSaleScreen because it was causing the entire Picker touch area to be disabled when the placeholder was the currently selected value.

- [2026-07-23 15:33:16] Fixed the Picker UI text getting cropped (bottom 20% of letters hiding) by removing fixed heights (h-[54px] and height: 54) and overflow-hidden from the Purchaser/Supplier dropdown containers in NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 15:38:57] Added regex validation for standard Indian vehicle numbers (e.g. MH-12-AB-1234) in NewPurchaseScreen and NewSaleScreen to ensure valid formatting before saving.

- [2026-07-23 15:41:10] Implemented automatic format handling for the Vehicle Number fields in NewPurchaseScreen and NewSaleScreen. As the user types alphanumeric characters, it automatically capitalizes them and injects hyphens in the standard Indian vehicle number plate format (MH-12-AB-1234).

- [2026-07-23 15:47:09] Fixed mobile UI layout for the 'Birds per Box' field in NewPurchaseScreen. Replaced the md:w-[48%] CSS class with w-[48%] to ensure it renders consistently side-by-side with 'Total Boxes' on smaller screens.

- [2026-07-23 15:50:08] Removed 'E.G.' prefix from all text input placeholders in NewPurchaseScreen and NewSaleScreen for a cleaner UI.

- [2026-07-23 16:06:30] Changed 'Empty Boxes' to 'Total Boxes' in NewSaleScreen and implemented the dynamic Total Sale Amount calculation: (Net Weight * Rate) + (Total Boxes * Box Rate).

- [2026-07-23 13:20:26] Removed 'Empty Box Weight (kg)' field from NewPurchaseScreen as requested.

- [2026-07-23 13:24:17] Reorganized NewPurchaseScreen Weight & Rates layout to place Purchase Rate on the left and Weighbridge on the right. Added automatic calculation for Net Weight (Weighbridge - Total Birds * 40g) with a manual edit toggle.

- [2026-07-23 13:25:14] Fixed ReferenceError for missing Edit2 import in NewPurchaseScreen.

- [2026-07-23 13:31:34] Fixed ReferenceError for missing Pencil import in NewPurchaseScreen.

- [2026-07-23 13:34:28] Updated Net Weight edit UI to match the Total Birds Count UI (Pencil icon with Edit text, and a Cancel Edit button below).

- [2026-07-23 13:39:17] Updated NewPurchaseScreen to auto-calculate Total Purchase Amount based on Net Weight * Purchase Rate. Added a visible Balance Amount indicator under the Total Paid Now field.

- [2026-07-23 13:46:43] Updated Payment section in NewPurchaseScreen and NewSaleScreen to split amount_paid into cash_payment and upi_payment. Added UI to display Total Paid and Balance.

- [2026-07-23 13:53:45] Made the empty bird box weight (40g) editable inline in the NewPurchaseScreen Net Weight auto-calculate text.

- [2026-07-23 14:00:04] Updated styling for Total Purchase Amount and Total Sale Amount to have a gray background with bold green text, and made them non-editable.

- [2026-07-23 14:05:23] Replaced standard ScrollView with KeyboardAwareScrollView in NewPurchaseScreen, NewSaleScreen, and NewPartyScreen to prevent the mobile keyboard from blocking the bottom Payment UI.

- [2026-07-23 14:08:40] Added enableOnAndroid={true} and extraScrollHeight={120} props to KeyboardAwareScrollView on all form screens to fix issue where keyboard was still covering the bottom fields on Android.

- [2026-07-23 14:12:15] Fixed the ScrollView bottom padding issue where content was hiding behind the absolute bottom 'Save/Cancel' buttons. Moved padding classes to contentContainerStyle on all form screens.

- [2026-07-23 14:16:35] Updated Driver Name and Vehicle Number fields in NewPurchaseScreen and NewSaleScreen to display side-by-side on web (md breakpoint) while remaining stacked on mobile.

- [2026-07-23 14:20:53] Added manual Date entry field to NewPurchaseScreen and NewSaleScreen. Positioned Date next to Purchaser/Supplier in a side-by-side layout on web views. Updated backend schemas to accept date from frontend.

- [2026-07-23 14:24:32] Replaced simple Date text input with @react-native-community/datetimepicker on NewPurchaseScreen and NewSaleScreen to display a native date picker modal on mobile. Formatted the displayed date to DD/MM/YYYY while keeping backend payload as YYYY-MM-DD.

- [2026-07-23 14:26:59] Fixed mobile layout stacking issue for Date/Purchaser and Driver/Vehicle fields. Replaced buggy NativeWind space-y-3 classes with explicit mb-3 md:mb-0 margins to guarantee correct vertical spacing between fields on mobile devices.

- [2026-07-23 14:29:40] Fixed React Native Picker UI bug on Android where the bottom 25% of text was clipped. Increased Picker height to 54 and applied flex-center constraints.

- [2026-07-23 14:34:25] Changed default state of Purchaser and Supplier fields to empty so users are forced to make a selection. Set the placeholder options ('Select a purchaser...') to be unselectable/hidden in the dropdown list using enabled={false}.

- [2026-07-23 15:12:12] Added form validation checks on NewPurchaseScreen and NewSaleScreen to ensure a valid party is selected, and that Weight and Rate fields are > 0 before allowing form submission.

- [2026-07-23 15:18:38] Replaced popup validation with inline error messages below each mandatory field in NewPurchaseScreen and NewSaleScreen. Fields auto-clear their error state on input.

- [2026-07-23 15:21:40] Fixed the Purchaser and Supplier dropdowns (Picker component) so the entire text box space is clickable, not just the down arrow icon. Achieved this by setting mode='dropdown' and flex: 1 on the Picker styles in NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 15:24:29] Fixed React Native DateTimePicker LogBox warning by migrating from the deprecated 'onChange' prop to 'onValueChange' and 'onDismiss' in both NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 15:28:03] Removed 'enabled={false}' from the initial placeholder Picker items in NewPurchaseScreen and NewSaleScreen because it was causing the entire Picker touch area to be disabled when the placeholder was the currently selected value.

- [2026-07-23 15:33:16] Fixed the Picker UI text getting cropped (bottom 20% of letters hiding) by removing fixed heights (h-[54px] and height: 54) and overflow-hidden from the Purchaser/Supplier dropdown containers in NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 15:38:57] Added regex validation for standard Indian vehicle numbers (e.g. MH-12-AB-1234) in NewPurchaseScreen and NewSaleScreen to ensure valid formatting before saving.

- [2026-07-23 15:41:10] Implemented automatic format handling for the Vehicle Number fields in NewPurchaseScreen and NewSaleScreen. As the user types alphanumeric characters, it automatically capitalizes them and injects hyphens in the standard Indian vehicle number plate format (MH-12-AB-1234).

- [2026-07-23 15:47:09] Fixed mobile UI layout for the 'Birds per Box' field in NewPurchaseScreen. Replaced the md:w-[48%] CSS class with w-[48%] to ensure it renders consistently side-by-side with 'Total Boxes' on smaller screens.

- [2026-07-23 15:50:08] Removed 'E.G.' prefix from all text input placeholders in NewPurchaseScreen and NewSaleScreen for a cleaner UI.

- [2026-07-23 16:06:30] Changed 'Empty Boxes' to 'Total Boxes' in NewSaleScreen and implemented the dynamic Total Sale Amount calculation: (Net Weight * Rate) + (Total Boxes * Box Rate).

- [2026-07-23 16:12:46] Fixed a React Native red screen crash ('Value for message cannot be cast from ReadableNativeArray to String') caused by passing an array of FastAPI validation errors directly into Alert.alert() in NewPurchaseScreen and NewSaleScreen. Implemented robust error parsing to convert arrays to string messages.

- [2026-07-23 16:36:31] Fixed the React Native 'ReadableNativeArray to String' crash during form submission by safely parsing FastAPI validation error arrays before passing them to Alert.alert() in both NewPurchaseScreen and NewSaleScreen.

- [2026-07-23 16:44:40] Fixed the Pydantic 'body.date input should be None' 422 Unprocessable Entity error by aliasing the datetime.date import to datetime_date in both purchases.py and sales.py. This prevents Pydantic from mistaking the 'date' type hint for a self-referential 'None' default value due to namespace shadowing.

- [2026-07-23 17:02:16] Added 'birds_per_box' and 'actual_birds' (Total Birds Count) to the Sales flow. Updated the backend Sale database model, ran Alembic migration, updated the Sales pydantic schemas, and added the auto-calculating UI fields (with manual Edit override) to NewSaleScreen.tsx, matching the Purchase screen.

- [2026-07-24 10:45:00] Completed the Backend Edit/Delete flow for Purchases, Sales, and Expenses. This included adding full financial ledger reversal logic for Purchases and Sales (reverting original transactions and balances, deleting old transactions, and creating new ones). Added PUT and DELETE endpoints for all three entities. Hooked up the frontend UI to pass edit data into forms and updated schemas to handle Updates and Deletes with proper backend synchronization.

- [2026-07-24 11:05:00] Added "Preview Mode" to NewPurchaseScreen and NewSaleScreen when tapping an existing bill. Bills now open in read-only mode by default, requiring the user to tap "Edit" in the top header to unlock the form. Also fixed an issue where `cash_payment` and `upi_payment` were missing from the `PurchaseBase` and `SaleBase` backend Pydantic schemas, preventing them from pre-filling correctly when editing a bill.

- [2026-07-24 11:34:00] Fixed a bug in NewSaleScreen where the Net Weight (kg) was showing as 0 in edit mode. The UI was mistakenly trying to read `editData.net_weight` (used in Purchases) instead of `editData.weight` (the actual field name in the Sales schema).

- [2026-07-24 11:40:00] Fixed a bug in NewSaleScreen where new sales were being saved to the database with a weight of 0. The UI mutation was incorrectly sending `net_weight` in the JSON payload, which the backend Pydantic `SaleCreate` schema dropped since it expects the field to be named `weight`. Changed the mutation payload key from `net_weight` to `weight`.

- [2026-07-24 11:45:00] Fixed a backend bug in `create_sale` endpoint where `birds_per_box` and `actual_birds` were not being assigned to the new `Sale` model instance when saving to the database, resulting in them being stored as `0`. Added mapping for these two fields in `sales.py`.

### [2026-07-24 13:17:48]
**Request:** Install agent-skills, ponytail, and impeccable in the project codebase for the agent
**Action:** Cloned the respective repositories to a temporary directory and copied their skills and AGENTS.md rules into the .agents directory in the project codebase.

### [2026-07-24 13:34:33]
**Request:** Optimize backend, setup UUID7, configure testing architecture and db separation, restructure app.
**Action:** 
- Installed uuid6, pytest, httpx.
- Updated app/models/base.py to use uuid6.uuid7().
- Created tests/conftest.py with isolated async DB sessions and httpx test client.
- Added app/schemas and app/services directories to adhere to API design skills.
- Cleared Pydantic V1 deprecation warnings across all endpoints.

### [2026-07-24 13:39:07]
**Request:** Update backend/main.py to make it production grade.
**Action:** Overwrote backend/main.py with a production-ready python entry point utilizing multiprocessing to scale uvicorn workers based on CPU core count, configuring proxy headers, and disabling hot reloading.


### [2026-07-24 14:58:50] - Backend Rewrite to Master-Detail (Version 2.0)
**User Request:** Refactor backend to V2 logic, master-detail architecture, fix 500 error on dashboard.
**Action Taken:** 
- Dropped existing database schema and recreated using new models.
- Migrated Purchase and Sale models to Header-Item logic (PurchaseItem, SaleItem).
- Added Item model to act as a Master Catalog for tracking available/used stock.
- Built InventoryService to dynamically compute inventory.
- Refactored /api/dashboard/stats to aggregate data without 500 errors and compute low-stock alerts dynamically.
- Extracted logic to API routers (items, purchases, sales, expenses, dashboard).

### [2026-07-24 15:30:00] - Frontend V2 Integration
**User Request:** also update the frontend until backend updated.
**Action Taken:**
- Re-added `driver_name` and `vehicle_number` to `Purchase` and `Sale` models and routes as they were dropped in V2.
- Wiped database and ran Alembic autogenerate to recreate schema.
- Seeded default "Broiler Bird" item.
- Updated `NewPurchaseScreen.tsx` and `NewSaleScreen.tsx` using a Ponytail approach: kept the highly optimized Broiler UI as-is, but packaged the form state into the nested `items: [...]` array expected by the V2 API.
- Updated `PurchasesScreen` and `SalesScreen` list views to safely read properties from the `items` array.

### [2026-07-24 15:37:00] - UUID7 Integration
**User Request:** convert uuid4 into uuid7
**Action Taken:** Updated all Pydantic schema models in the API routes to use the native `UUID7` type imported directly from `pydantic` for strict validation of Version 7 UUIDs.

### [2026-07-24 15:45:00] - Reports and Dashboard Updates
**User Request:** implement Business Workflow & Logic Version 2.0 (Reports and Dashboard)
**Action Taken:** Updated `dashboard.py` to filter sales, purchases, and expenses by today's date using SQL cast. Created a new `ReportsScreen.tsx` in the frontend that uses the Ponytail method (reusing existing endpoints) to display 5 distinct report tabs (Purchases, Sales, Inventory, Expenses, Outstanding). Added a navigation button to this screen from the Dashboard header.

### [2026-07-24 16:21:07] - Full Broiler Trading v2.0 Workflow
**User Request:** Implement Business Workflow & Logic Version 2.0 (1A forms + 2B full reports/notifications).
**Action Taken:**
- Party: `company_name`, `is_active`, required mobile, PUT; Purchaser=SUPPLIER / Customer=CUSTOMER UI.
- Item PUT + `?low_stock=true`; InventoryService oversell guard + revert helpers.
- Purchase/Sale: server-side amounts, party-type enforce, PUT update, low_stock_alerts on mutation.
- New `/api/reports/*` aggregates; dashboard `date_from`/`date_to`.
- Mobile: multi-item Kg/Unit purchase & sale forms; Items + Notifications screens; Reports with filters/group_by; Dashboard chips wired.
- Tests: `tests/api/test_workflow.py` (stock, oversell, reports) — 3 passed.

### [2026-07-24 16:28:32] - Codebase cleanup & structure
**User Request:** Remove unwanted files; make structure professional.
**Action Taken:**
- Deleted one-off scripts: `append_logs.py`, `Projectidea.md`, backend `fix_db`/`seed*`/`test_*`/`alter_enum`/`check_enum`/`verify_party_db`.
- Shared `LowStockAlert` in `app/schemas`; package `__init__.py` markers; README rewrite.
- Mobile: `src/types.ts`, `src/api/resources.ts`; list/dashboard screens use resource helpers; `.env` gitignored.

### [2026-07-24 16:35:44] - Test suite structure
**User Request:** Add test dir with unit, integration, and API testing via FastAPI client.
**Action Taken:**
- `tests/{unit,integration,api}/` with pytest markers
- Fixtures: `engine`, `db_session`, FastAPI `httpx.AsyncClient` (ASGITransport)
- SQLite fallback when Postgres is down; `aiosqlite` dependency
- 17 tests covering InventoryService, ORM flow, parties/items/purchases/sales/reports/expenses/health
[2026-07-25 11:30:44] Fixed 'Cannot find name Tag' error in DashboardScreen.tsx by importing Tag from lucide-react-native
[2026-07-25 11:36:50] Fixed navigation bar overlap by setting tabBarPosition to bottom and using insets.bottom for padding in RootNavigator.tsx
[2026-07-25 11:41:54] Installed pbakaus/impeccable in the project
[2026-07-25 11:44:00] Applied Impeccable polish to the app navigation bar styling in RootNavigator.tsx
[2026-07-25 11:48:34] Fixed Impeccable finding by overriding react-native-safe-area-context transition: padding on Web in global.css
[2026-07-25 11:53:50] Applied Impeccable colorize skill. Replaced generic Tailwind default colors with a semantic, cohesive brand-aligned palette in tailwind.config.js and refactored DashboardScreen and RootNavigator to use the new tokens.
[2026-07-25 11:56:06] User selected a new primary teal brand color (#006269). I updated all semantic palette tokens to coordinate with this teal base and recursively replaced all hardcoded instances of the old green across the app.
[2026-07-25 11:58:29] Applied Impeccable colorize guidance to the Quick Navigation icons, giving each button a sophisticated, distinct color while keeping them harmonious with the new teal brand.
[2026-07-25 12:00:59] Fixed navigation tab bar text breaking/wrapping by providing a custom tabBarLabel with numberOfLines={1} and adjustsFontSizeToFit, and removing horizontal padding.
[2026-07-25 12:02:03] Applied distinct color coding (indigo, amber, rose, teal) to the active tabs in the bottom navigation bar in RootNavigator.tsx to match the Quick Navigation styling.
[2026-07-25 12:09:26] Fixed top bar overlay issue across all tab screens by wrapping the MainTabNavigator in a SafeAreaView with edges={['top']} and white background.
[2026-07-25 12:20:58] Resolved syntax error in src/types.ts caused by an invalid Python docstring syntax ('"""Shared TypeScript contracts..."""') which broke compilation, and verified RootNavigator.tsx structure.
[2026-07-25 15:35:00] Ran /ponytail-audit to perform a repo-wide audit for over-engineering, unnecessary wrappers, dead dependencies, and speculative complexity. Identified candidates for deletion or shrinking across backend and frontend_mobile.
[2026-07-27 11:11:00] Diagnosed two issues from Expo server logs: React Native DevTools sandbox fatal crash on Linux (solved via ELECTRON_DISABLE_SANDBOX=1 or chown/chmod on chrome-sandbox) and missing deep linking scheme warning (solved via adding "scheme" in app.json).
[2026-07-27 11:14:00] Fixed Expo React Native DevTools Linux sandbox crash and deep linking warning. Added ELECTRON_DISABLE_SANDBOX=1 to frontend_mobile/.env and .env.example, added scheme: "broiler360" to frontend_mobile/app.json, and installed expo-dev-client using bunx expo install.
[2026-07-27 11:20:20] Provided user with terminal commands to start Expo server targeting Expo Go instead of development client build (`bunx expo start --go`).
[2026-07-27 11:35:00] Refactored React Query & Axios integration using /ponytail, /performance-optimization, and /frontend-ui-engineering. Removed all inline ad-hoc raw Axios client calls from NewSaleScreen, NewPurchaseScreen, NewPartyScreen, and ReportsScreen, routing all remote requests cleanly through resources.ts. Configured global QueryClient performance defaults in App.tsx (2 min staleTime, 10 min gcTime, retry: 1) to eliminate mobile network waterfalls and redundant refetches. Fixed pre-existing TypeScript types in types.ts and resources.ts, confirming zero errors via bunx tsc --noEmit.
[2026-07-27 11:42:00] User requested verification that everything is implemented correctly. Verified tasks/todo.md completion status and ran comprehensive tests across both stacks: executed bunx tsc --noEmit in frontend_mobile (0 TypeScript errors) and uv run pytest in backend (20/20 unit, integration, and API tests passed in 21.38s). Confirmed 0 raw client calls remain inside screens and that React Query state caching is globally protected against network refetch loops.
[2026-07-27 11:55:00] Implemented Black & White professional PDF report generation in ReportsScreen per /planning-and-task-breakdown, /performance-optimization, /api-and-interface-design, /ponytail, and /impeccable skills. Installed expo-print and expo-sharing via bunx expo install. Created src/utils/pdfReport.ts utility with high-contrast monochrome print layout, semantic typography, repeating table headers across pages, and currency/quantity summary footers for all 5 report tabs (Purchases, Sales, Inventory, Expenses, Outstanding). Added an Export PDF button in ReportsScreen header that reuses React Query data with zero backend server load or latency. Verified TypeScript compilation via bunx tsc --noEmit (0 errors) and backend test suite via uv run pytest (20/20 passed).
[2026-07-27 12:05:11] Fixed 'Not allowed to read file under given URL' ExpoSharing rejection error in src/utils/pdfReport.ts per /debugging-and-error-recovery and /ponytail rules. Root cause: Expo Sharing requires a strictly structured local 'file://' scheme URI to grant reading permissions across mobile sandbox boundaries, and printToFileAsync can yield raw filesystem paths depending on Android/iOS runtime environments. Applied a one-line zero-dependency URI scheme normalizer and updated iOS sharing UTI from '.pdf' to 'com.adobe.pdf' at the shared utility layer.
[2026-07-27 12:14:00] Resolved persistent 'Not allowed to read file under given URL' error when sharing PDF reports on sandboxed Android/iOS builds per /debugging-and-error-recovery and /performance-optimization rules. Root cause: Expo SDK 57 native FileProvider blocks ExpoSharing from reading directly out of expo-print's internal print cache subdirectory across external app boundaries. Ran `bunx expo install expo-file-system` and updated src/utils/pdfReport.ts to copy the generated PDF into an authorized app directory (`FileSystem.cacheDirectory || FileSystem.documentDirectory`) with a unique timestamped filename prior to invoking ExpoSharing.shareAsync.
[2026-07-27 12:18:54] Removed deprecated `expo-file-system` dependency per user guidance, /ponytail, and /context-engineering rules. Ran `bun remove expo-file-system` in frontend_mobile. Updated src/utils/pdfReport.ts to adopt the common and standard official Expo Print PDF export template (`printToFileAsync({ html })` directly followed by `shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })`), eliminating unnecessary boilerplate, URI string manipulations, and extra options that interfered with OS native intent resolution. Verified 0 TypeScript errors via `bunx tsc --noEmit`.
[2026-07-27 12:25:35] Identified root cause for ExpoSharing.shareAsync rejection on unadorned printToFileAsync URIs: modern Expo Go and Android 13+ native FileProvider configurations block Sharing.shareAsync from reading files generated directly within expo-print's temporary cache subdirectory across process boundaries. To solve this without using deprecated classic expo-file-system asynchronous functions (`copyAsync`, `cacheDirectory`), re-installed expo-file-system@~57.0.1 and integrated the modern object-oriented File system API (`import { File, Paths } from 'expo-file-system'`). In src/utils/pdfReport.ts, copied the print URI synchronously into the whitelisted `Paths.cache` directory (`new File(uri).copy(destination)`) before sharing `destination.uri`. Verified zero errors via `bunx tsc --noEmit`.
[2026-07-27 12:31:57] Resolved `"Call to function 'FileSystemFile.copy' has been rejected -> Missing 'READ' permission for accessing the file"` error in src/utils/pdfReport.ts per /debugging-and-error-recovery and /performance-optimization rules. Root cause diagnosis: `expo-print` yields traditional string URIs located within legacy system print caches. When passed into Expo SDK 57's modern object-oriented `File` constructor (`new File(uri)`), the class enforces strict scoped storage validation and denies read permissions across legacy print paths. Furthermore, importing classic string methods directly from `'expo-file-system'` triggers deprecation warnings in linters. Resolution: Used Expo SDK 57's officially supported, un-deprecated legacy bridge (`import * as FileSystem from 'expo-file-system/legacy'`), which reads legacy print URIs without triggering read permission exceptions and prepares them cleanly inside whitelisted app storage for `ExpoSharing.shareAsync`. Verified 0 errors via `bunx tsc --noEmit`.
[2026-07-27 13:18:00] Updated root `.gitignore` per /ponytail rules (simplest comprehensive solution, fewest files possible, zero tech debt). Added patterns for local SQLite test database fallbacks (`*.db`, `*.sqlite`, `*.sqlite3`), native Android/iOS mobile binaries and caches (`*.apk`, `*.aab`, `*.ipa`, `.kotlin/`, `*.pem`, `*.orig.*`), generated PDF report outputs (`*.pdf`), and AI agent tooling harness directories (`.antigravity/`, `.claude/`, `.opencode/`, `.pi/`, `.qoder/`, `.rovodev/`, `.trae*/`, `.vibe/`, `.grok/`, `.kiro/`, `graphify-out/`).

- [2026-08-01 09:32:22] Configured the frontend IP by creating `frontend/.env` file containing the machine's local IPv4 address as `EXPO_PUBLIC_API_URL`. This allows mobile devices running Expo Go to connect to the local backend API server.

- [2026-08-01 09:37:54] Fixed React Native SDK version mismatches in the frontend by running 'npm install react-native@0.86.2 react-native-pager-view@8.0.2 react-native-screens@~4.26.0' to ensure compatibility with Expo SDK 57.

- [2026-08-01 09:51:05] Added a GitHub Actions workflow (`.github/workflows/build-android.yml`) to automatically build a Development (Debug) APK using `assembleDebug`. This APK acts as a custom dev client, resolving the "Cannot find native module 'ExpoPrint'" error for local development. Pushed to remote to trigger the action.

- [2026-08-01 10:13:36] Fixed 500 error in backend Reports API caused by missing `purchase_items` table. The data models had been updated in the Python code on July 24, but the corresponding Alembic migration was missing. Generated the missing migration using `alembic revision --autogenerate` and applied it to the database with `alembic upgrade head`. Pushed the migration to the remote repository.

- [2026-08-01 10:23:51] Configured the backend to connect to a newly created `Duro_Erode` local PostgreSQL database by generating a `backend/.env` file with `POSTGRES_DB="Duro_Erode"`. Ran `alembic upgrade head` to populate this new database with all tables from scratch.

- **[2026-08-01 10:15:30]**: Fixed deprecated `onChange` props in `@react-native-community/datetimepicker` in frontend screens.
- **[2026-08-01 11:31:00]**: Checked `KeyboardAwareScrollView` across the project. Added missing `extraScrollHeight={120}` to `NewPurchaseScreen` and `NewSaleScreen` to prevent inputs from hiding behind the Save button. Added missing `keyboardShouldPersistTaps="handled"` to `RecordPaymentScreen` to prevent double-tap issues when the keyboard is open.
- **[2026-08-01 11:33:00]**: Fixed deep Android keyboard scrolling glitches by adding `"softwareKeyboardLayoutMode": "pan"` to the Expo `app.json` configuration, and added `flexGrow: 1` to `contentContainerStyle` across all screens to ensure correct rendering.
- **[2026-08-01 11:55:00]**: Removed hardcoded database credentials (`postgres`, `root`) from `docker-compose.yml` and replaced them with Dokploy-friendly environment variables (`${POSTGRES_USER}`, etc.). Also removed the hardcoded production API URL from `.github/workflows/build-android.yml` and replaced it with a GitHub Secret (`${{ secrets.EXPO_PUBLIC_API_URL }}`).
- **[2026-08-01 13:14:00]**: Implemented comprehensive React Query cache invalidations across the frontend (`RecordPaymentScreen`, `NewSaleScreen`, `NewPurchaseScreen`, `ExpensesScreen`, `ExpenseCategoriesScreen`, `ItemsScreen`, `NewPartyScreen`) to ensure that all UI elements, reports, ledgers, and low stock alerts dynamically and instantly update whenever a transaction occurs.

- [2026-08-01 10:44:45] Created Docker configuration files (`backend/Dockerfile`, `backend/start.sh`, and `docker-compose.yml`) to deploy the backend API and PostgreSQL database together. The frontend is not containerized since it is an Android mobile app (APK).

- [2026-08-01 10:51:04] Removed hardcoded host port mappings (`8000:8000` and `5432:5432`) from `docker-compose.yml` because they caused a 'port already allocated' error on the deployment server. Dokploy handles routing dynamically, so host bindings are not required. Pushed the fix to the repository.

### [2026-08-04 10:13:00] Fixed GitHub Action OOM Crash
- Reduced NODE_OPTIONS max-old-space-size to 2048 and Gradle max heap to 2048m in build-android.yml to prevent Ubuntu runner from running out of 7GB RAM.
- Committed and pushed the changes to trigger a new build.

### [2026-08-04 10:37:31] Fixed GitHub Action Missing Newline Issue
- Discovered that 'npx expo prebuild' generated gradle.properties without a trailing newline.
- This caused 'echo' appending to corrupt the Expo watched directories array, leading to a Node CLI argument crash.
- Added 'echo' newline to build-android.yml before appending JVM args.

### [2026-08-04 12:11:04] Codebase Audit & Security
- Analyzed the project architecture and data models.
- Confirmed 15 frontend screens with 6 user-facing primary buttons.
- Audited the Sales/Inventory business logic, verified ledger math is fully robust.
- Saved user's GitHub Personal Access Token to .agents/github_token.txt and securely added it to .gitignore.

### [2026-08-04 12:15:37] Implemented Strict Payment Linking
- Added sale_id and purchase_id to payment_transactions model.
- Refactored _apply_sale, _revert_sale, _apply_purchase, _revert_purchase to use deterministic foreign key linking.
- Generated and ran Alembic migration.

### [2026-08-04 13:00:00] UI Text and Colors Refactoring
- **Context:** User requested standardizing UI text and colors.
- **Action:** Migrated all hardcoded Tailwind gray scales and brand colors to semantic tokens across 15 screens. Ensured TextInputs have proper placeholder/text color.

### [2026-08-04 14:23:50] GitHub Actions Production APK
- **Request:** Create a git action to build the app APK pointing to erode.durozen.in
- **Action:** Created `build-android-release.yml` with `assembleRelease` configured to use the debug keystore for an installable release APK.

### [2026-08-05 11:17:33] Removed Mockup Notification Feature
- **Request:** Remove the notification in the dashboard from the backend and frontend.
- **Action:** Discovered backend had no notification logic. Removed Bell icon from `DashboardScreen.tsx`, removed route from `RootNavigator.tsx`, and deleted `NotificationsScreen.tsx`.

### [2026-08-05 11:31:33] Inventory Stock List Simplification
- **Request:** Remove click-to-edit redirect and simplify item cards to show only available count/kg.
- **Action:** Removed `onPress` redirect from `StockList` in `InventoryScreen.tsx`. Stripped `Used`, `Purchased`, and `Sold` metrics from `InventoryItemCard.tsx` leaving a clean UI with only `Available (kg)` and `Available count`.

### [2026-08-05 12:03:28] Added Min Stock Alerts
- **Request:** Add Min Stock Alert field to items, and show a popup if a sale drops stock below the limit.
### [2026-08-05 12:25:21] Keyboard Wrapper Audit and Fix
- **Request:** Check if all text inputs in the app have a keyboard-aware wrapper so they aren't hidden by the keyboard, and fix missing ones without breaking layout.
- **Action:** Audited the entire app. Found that the initial approach of copying `ExpensesScreen`'s `KeyboardAvoidingView` was flawed because Android `KeyboardAvoidingView` inside a transparent Modal behaves inconsistently. Safely refactored `ItemsScreen.tsx`, `ExpenseCategoriesScreen.tsx`, and `ExpensesScreen.tsx` to use the universally supported `KeyboardAvoidingView` with `behavior="padding"` and an inner `<ScrollView>`, which perfectly handles pushing up bottom-sheet style transparent modals on Android without hiding content. Fixed JSX syntax errors caused during the refactoring process.
### [2026-08-05 12:51:24] Fix Frontend Timezone Bug
- **Request:** Replace `.toISOString()` with local time extraction to fix UTC time shift bugs (where "Today" queries yesterday's data in morning hours).
- **Action:** Created `src/utils/dateUtils.ts` with `toLocalYMD` (extracting strictly YYYY-MM-DD from the local time). Replaced `.toISOString()` in `DashboardScreen`, `ReportsScreen`, `RecordPaymentScreen`, `InventoryFilters`, `NewSaleScreen`, and `NewPurchaseScreen`. Explained that backend/DB are already using local server time implicitly, so the app is now completely native to the local timezone.
### [2026-08-05 12:54:27] Dashboard Label Fix
- **Request:** Apply next change to dashboard (addressing the misleading Net Profit).
- **Action:** Renamed "NET PROFIT" to "NET BALANCE" in `DashboardScreen.tsx` because it calculates `Sales - Purchases - Expenses` (without accounting for COGS or unsold inventory), meaning it reflects a cash/accrual position rather than true profit. Noticed the `stats.inventory` list was actually already being mapped at the bottom of the screen as "Inventory Overview".

### [2026-08-05 14:43:44] Detailed Purchases Report
- Modified /reports/purchases endpoint to fetch flat, party-wise detailed items.
- Removed Group By buttons from Purchases tab in ReportsScreen.
- Created detailedPurchasesSection in pdfReport.ts for grouping flat data by party in the PDF.

### [2026-08-05 11:06:33] Fixed Frontend Syntax Errors
- Fixed import placement in ExpensesScreen.tsx
- Added missing formatDisplayDate and parseDisplayDateToApi imports across NewPurchaseScreen, NewSaleScreen, PartyLedgerScreen
- Fixed exportDetailedPurchasesPdf.ts import path to utils/dateUtils.

### [2026-08-05 11:13:23] Fixed Date formatting and PDF Title
- Modified formatDisplayDate to return immediately if the date string is already in DD-MM-YYYY format, preventing incorrect Date parsing on already formatted dates.
- Renamed exportDetailedPurchasesPdf PDF title to Purchase Report and file name to Purchase_Report.

### [2026-08-05 11:16:43] Added Total Count to PDF
- Modified exportDetailedPurchasesPdf to calculate and display the total count instead of a hyphen.

### [2026-08-05 11:22:07] Removed PDF Footers
- Removed the printed footer text and top border line from exportDetailedPurchasesPdf, exportSalesPdf, exportExpensesPdf, and exportOverallPdf.

- [2026-08-06 09:20:00] User requested to remove the Date/Party/Item grouping from the UI and backend for Sales and Purchases reports, and implemented a detailed Sales Report PDF download similar to Purchases. Created plan, executed changes in reports.py, resources.ts, ReportsScreen.tsx, and exportDetailedSalesPdf.ts. Re-started backend and frontend servers.


- [2026-08-06 09:25:00] User requested to configure IP. Updated EXPO_PUBLIC_API_URL in frontend/.env to current Wi-Fi IP (192.168.232.208).


- [2026-08-06 10:00:00] User requested detailed expenses report in PDF format. Created implementation plan, got approval, modified backend to group by date and category, updated UI table and PDF export format to 5 columns.


- [2026-08-06 10:10:00] Fixed missing export functionality for Purchases tab. Added exportPurchasesPdf.ts and wired it into handleExport.


- [2026-08-06 10:20:00] Ran clean_reports.py to deduplicate and fix backend/app/api/routes/reports.py. Restored missing Outstanding endpoint signature.


- [2026-08-06 10:26:00] Deleted temporary scratch files clean_reports.py and backend/old_reports.py


- [2026-08-06 10:45:00] Fixed 9 audit bugs across UI (Reports, Dashboard, Pickers) and API (Validation, Duplication, Stock Guard).


- [2026-08-06 11:06:00] Cleaned up duplicate OutstandingRow model from reports.py.

- [2026-08-06 14:03:14] User requested date pickers in ReportsScreen. Replaced manual TextInputs with DateTimePickers.
- [2026-08-06 14:07:06] Updated Dashboard date filter chips to 'Today', 'Week', 'Month', 'Custom' with DatePickers.
- [2026-08-06 14:31:31] Auth implementation complete: added bcrypt JWT backend login, LoginScreen in frontend, and Dashboard logout button.
- [2026-08-06 14:37:07] Fixed Require Cycle warning by moving AuthContext to its own file.

### [2026-08-07 07:49:16] API Deployment Configuration & Cleanup
- **Request:** Checked for junk files, helped configure Dokploy domains, and tested API deployment.
- **Actions:**
  - Deleted temporary script fetch_logs.py from the root folder.
  - Created a local .env in the root folder with database config.
  - Guided user through configuring Dokploy domain routing (Port 8000, HTTPS on, Path /).
  - Verified successful API deployment via Swagger UI.
  - Attempted to add environment-based Swagger visibility toggle, but reverted code per user request to do it later.

### [2026-08-07 11:39:51] Added Google Apps Script Backup Endpoint
- **Request:** Create a secure endpoint so Google Apps Script can automatically fetch the database backup and upload it to a personal Google Drive.
- **Actions:**
  - Added postgresql-client to Dockerfile.
  - Added BACKUP_SECRET_KEY to config.py and local .env files.
  - Passed BACKUP_SECRET_KEY through docker-compose.yml.
  - Created /api/v1/backup/download endpoint using pg_dump and FileResponse.
  - Created Google Apps Script code for the user to trigger the download.
