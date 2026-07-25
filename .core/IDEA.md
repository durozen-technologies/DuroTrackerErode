# Ideas Log

*This document serves as the chronological scribe for all ideas, feature requests, and conceptual thoughts for BROILER 360.*

## [2026-07-21] Initial Project Idea

Design and develop a modern, mobile-first poultry business management application named **BROILER 360**. The application is intended for poultry wholesalers, farms, and chicken shops to digitally manage their entire business from a single platform. The focus should be on **speed, simplicity, and real-time business tracking**, replacing traditional paper registers.

The application should support both **Android mobile devices** (primary platform) and a **responsive desktop/web interface** for office use. Both platforms must share the same backend and database so that all information remains synchronized in real time.

**Key Features Needed:**
1. **Dashboard**: Complete overview with total sales, purchases, expenses, profit, outstanding balances, and total birds/weights.
2. **Party Management**: Create Customers and Suppliers. Track opening balance, outstanding due, bills, and payments (Cash/UPI).
3. **Purchase Module**: Record poultry purchases. Auto-calculate expected birds, net weight, average weight, and total amount.
4. **Sales Module**: Record sales to customers based on weight and boxes. Auto-calculate totals and balances.
5. **Expense Management**: Configurable expense categories (Fuel, Salary, Feed, etc.).
6. **Reports & PDF Generation**: Purchase, Sales, Expense, and Party Ledger reports with PDF generation.

The app must be simple, reliable, and prioritize fast data entry.

## [2026-07-24 16:21:07] Live Broiler Trading Management System v2.0

Full business workflow spec: Purchase → Inventory↑ → Customer Sales → Inventory↓ → Expenses → Dashboard → Reports.
- Spec-first multi-item bills (Kg vs Unit), cash/UPI, automatic inventory, low-stock notifications.
- Reports: purchaser/customer/item/date wise; outstanding ledgers.
- Locked implementation choices: 1A (replace weighbridge forms) + 2B (full reports + notification screen).
