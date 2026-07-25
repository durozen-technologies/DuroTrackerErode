import client from './client';
import type {
  AggregatedReport,
  Bill,
  DashboardStats,
  Item,
  Party,
  PartyLedger,
  PartyType,
  PaymentResult,
} from '../types';

export async function fetchParties(partyType?: PartyType, activeOnly = true): Promise<Party[]> {
  const params = new URLSearchParams();
  if (partyType) params.set('party_type', partyType);
  params.set('active_only', String(activeOnly));
  return (await client.get(`/parties/?${params}`)).data;
}

export async function createParty(payload: Partial<Party> & { name: string; mobile: string; type: PartyType }) {
  return (await client.post('/parties/', payload)).data as Party;
}

export async function updateParty(id: string, payload: Partial<Party>) {
  return (await client.put(`/parties/${id}`, payload)).data as Party;
}

export async function fetchPartyLedger(partyId: string): Promise<PartyLedger> {
  return (await client.get(`/parties/${partyId}/ledger`)).data;
}

export async function recordPayment(payload: {
  party_id: string;
  date?: string;
  cash_amount: number;
  upi_amount: number;
}): Promise<PaymentResult> {
  return (await client.post('/payments/', payload)).data;
}

export async function fetchItems(lowStock = false): Promise<Item[]> {
  const q = lowStock ? '?low_stock=true' : '';
  return (await client.get(`/items/${q}`)).data;
}

export async function createItem(payload: Pick<Item, 'name_ta' | 'name_en' | 'unit_type' | 'minimum_stock'>) {
  return (await client.post('/items/', payload)).data as Item;
}

export async function updateItem(id: string, payload: Partial<Item>) {
  return (await client.put(`/items/${id}`, payload)).data as Item;
}

export async function fetchPurchases(): Promise<Bill[]> {
  return (await client.get('/purchases/')).data;
}

export async function createPurchase(payload: object) {
  return (await client.post('/purchases/', payload)).data as Bill;
}

export async function updatePurchase(id: string, payload: object) {
  return (await client.put(`/purchases/${id}`, payload)).data as Bill;
}

export async function deletePurchase(id: string) {
  await client.delete(`/purchases/${id}`);
}

export async function fetchSales(): Promise<Bill[]> {
  return (await client.get('/sales/')).data;
}

export async function createSale(payload: object) {
  return (await client.post('/sales/', payload)).data as Bill;
}

export async function updateSale(id: string, payload: object) {
  return (await client.put(`/sales/${id}`, payload)).data as Bill;
}

export async function deleteSale(id: string) {
  await client.delete(`/sales/${id}`);
}

export async function fetchDashboardStats(dateFrom: string, dateTo: string): Promise<DashboardStats> {
  return (await client.get(`/dashboard/stats?date_from=${dateFrom}&date_to=${dateTo}`)).data;
}

export async function fetchReport(path: string): Promise<AggregatedReport | any> {
  return (await client.get(path)).data;
}
