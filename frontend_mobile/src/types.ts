/** Shared TypeScript contracts for Broiler 360 API responses. */

export type PartyType = 'SUPPLIER' | 'CUSTOMER';
export type UnitType = 'KG' | 'UNIT';
export type TransactionType = 'received' | 'paid';

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  company_name?: string | null;
  mobile: string;
  address?: string | null;
  opening_balance: number;
  unpaid_opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

export interface Item {
  id: string;
  name_ta: string;
  name_en: string;
  unit_type: UnitType;
  available_stock: number;
  used_stock: number;
  minimum_stock: number;
}

export interface BillLine {
  id?: string;
  item_id: string;
  quantity: number;
  count?: number | null;
  rate: number;
  amount: number;
  item_name_en?: string;
  item_name_ta?: string;
  unit_type?: string;
}

export interface Bill {
  id: string;
  party_id: string;
  party_name?: string;
  date: string;
  total_amount: number;
  cash_payment: number;
  upi_payment: number;
  balance_amount: number;
  driver_name?: string | null;
  vehicle_number?: string | null;
  items: BillLine[];
  low_stock_alerts?: LowStockAlert[];
}

export interface LowStockAlert {
  item_name: string;
  available: number;
  minimum: number;
}

export interface DashboardStats {
  total_sales: number;
  total_purchases: number;
  total_expenses: number;
  net_profit: number;
  customer_outstanding: number;
  supplier_outstanding: number;
  inventory: { item_name: string; available_stock: number; used_stock: number }[];
  low_stock_alerts: LowStockAlert[];
  date_from: string;
  date_to: string;
}

export interface ReportRow {
  key: string;
  label: string;
  quantity: number;
  amount: number;
  count: number;
}

export interface AggregatedReport {
  group_by: string;
  rows: ReportRow[];
  total_quantity: number;
  total_amount: number;
}

export interface LedgerBillEntry {
  kind: 'bill';
  id: string;
  date: string;
  total_amount: number;
  cash_payment: number;
  upi_payment: number;
  balance_amount: number;
  bill_type: 'sale' | 'purchase';
}

export interface LedgerPaymentEntry {
  kind: 'payment';
  id: string;
  date: string;
  type: TransactionType;
  cash_amount: number;
  upi_amount: number;
  total_amount: number;
}

export type LedgerEntry = LedgerBillEntry | LedgerPaymentEntry;

export interface PartyLedger {
  party_id: string;
  name: string;
  type: PartyType;
  opening_balance: number;
  unpaid_opening_balance: number;
  current_balance: number;
  bills_due: number;
  total_due: number;
  entries: LedgerEntry[];
}

export interface BillAllocation {
  bill_id: string;
  bill_type: 'sale' | 'purchase';
  amount_applied: number;
  balance_remaining: number;
}

export interface PaymentResult {
  id: string;
  party_id: string;
  date: string;
  type: TransactionType;
  cash_amount: number;
  upi_amount: number;
  total_amount: number;
  opening_settled: number;
  bill_allocations: BillAllocation[];
  unpaid_opening_balance: number;
  current_balance: number;
}
