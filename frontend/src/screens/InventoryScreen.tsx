import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Package, RefreshCcw } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import {
  fetchInventoryReport,
  fetchItems,
  fetchParties,
  fetchPurchases,
  fetchSales,
} from '../api/resources';
import type { Bill, InventoryReportRow, Item, Party } from '../types';
import InventoryFilters, {
  EMPTY_FILTERS,
  type InventoryFilterState,
  type InventorySegment,
} from '../components/inventory/InventoryFilters';
import { StockList, PartyList } from '../components/inventory/StockPartyLists';
import BillList from '../components/inventory/BillList';

const SEGMENTS: { id: InventorySegment; label: string }[] = [
  { id: 'stock', label: 'Stock' },
  { id: 'parties', label: 'Parties' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'sales', label: 'Sales' },
];

function filterBills(bills: Bill[] | undefined, filters: InventoryFilterState): Bill[] {
  if (!bills) return [];
  return bills.filter((b) => {
    if (filters.dateFrom && b.date < filters.dateFrom) return false;
    if (filters.dateTo && b.date > filters.dateTo) return false;
    if (filters.partyId && b.party_id !== filters.partyId) return false;
    if (filters.itemId) {
      const hit = (b.items || []).some((line) => line.item_id === filters.itemId);
      if (!hit) return false;
    }
    return true;
  });
}

function filterStockRows(
  rows: InventoryReportRow[] | undefined,
  filters: InventoryFilterState,
): InventoryReportRow[] {
  if (!rows) return [];
  return rows.filter((row) => {
    if (filters.itemId && row.item_id !== filters.itemId) return false;
    return true;
  });
}

function filterParties(parties: Party[] | undefined, filters: InventoryFilterState): Party[] {
  if (!parties) return [];
  return parties.filter((p) => {
    if (filters.partyType && p.type !== filters.partyType) return false;
    if (filters.partyId && p.id !== filters.partyId) return false;
    return true;
  });
}

export default function InventoryScreen({ navigation }: any) {
  const [segment, setSegment] = useState<InventorySegment>('stock');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilterState>(EMPTY_FILTERS);

  const itemsQ = useQuery({ queryKey: ['items'], queryFn: () => fetchItems() });
  const stockQ = useQuery({
    queryKey: ['inventory-report'],
    queryFn: fetchInventoryReport,
  });
  const partiesQ = useQuery({
    queryKey: ['parties', 'ALL'],
    queryFn: () => fetchParties(undefined, true),
  });
  const purchasesQ = useQuery({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
    enabled: segment === 'purchases',
  });
  const salesQ = useQuery({
    queryKey: ['sales'],
    queryFn: fetchSales,
    enabled: segment === 'sales',
  });

  const stockRows = useMemo(
    () => filterStockRows(stockQ.data, filters),
    [stockQ.data, filters],
  );
  const partyRows = useMemo(() => filterParties(partiesQ.data, filters), [partiesQ.data, filters]);
  const purchaseRows = useMemo(
    () => filterBills(purchasesQ.data, filters),
    [purchasesQ.data, filters],
  );
  const saleRows = useMemo(() => filterBills(salesQ.data, filters), [salesQ.data, filters]);

  const isLoading =
    segment === 'stock'
      ? stockQ.isLoading
      : segment === 'parties'
        ? partiesQ.isLoading
        : segment === 'purchases'
          ? purchasesQ.isLoading
          : salesQ.isLoading;

  const isError =
    segment === 'stock'
      ? stockQ.isError
      : segment === 'parties'
        ? partiesQ.isError
        : segment === 'purchases'
          ? purchasesQ.isError
          : salesQ.isError;

  const errorMsg =
    (segment === 'stock' && (stockQ.error as Error)?.message) ||
    (segment === 'parties' && (partiesQ.error as Error)?.message) ||
    (segment === 'purchases' && (purchasesQ.error as Error)?.message) ||
    (segment === 'sales' && (salesQ.error as Error)?.message) ||
    'Failed to load';

  const isRefetching =
    stockQ.isRefetching ||
    itemsQ.isRefetching ||
    partiesQ.isRefetching ||
    purchasesQ.isRefetching ||
    salesQ.isRefetching;

  const onRefresh = () => {
    stockQ.refetch();
    itemsQ.refetch();
    partiesQ.refetch();
    if (segment === 'purchases') purchasesQ.refetch();
    if (segment === 'sales') salesQ.refetch();
  };

  const openStockItem = (row: InventoryReportRow) => {
    const item = (itemsQ.data || []).find((it: Item) => it.id === row.item_id);
    if (item) {
      navigation.navigate('Items', { editItem: item });
      return;
    }
    // Fallback when items cache is empty: pass report fields Items can still open.
    navigation.navigate('Items', {
      editItem: {
        id: row.item_id,
        name_en: row.name_en,
        name_ta: row.name_ta,
        unit_type: row.unit_type,
        available_stock: row.available_stock,
        used_stock: row.used_stock,
      },
    });
  };

  const summary =
    segment === 'stock'
      ? `${stockRows.length} item${stockRows.length === 1 ? '' : 's'}`
      : segment === 'parties'
        ? `${partyRows.length} part${partyRows.length === 1 ? 'y' : 'ies'}`
        : segment === 'purchases'
          ? `${purchaseRows.length} bill${purchaseRows.length === 1 ? '' : 's'}`
          : `${saleRows.length} bill${saleRows.length === 1 ? '' : 's'}`;

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-4 py-3 bg-surface border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Package size={20} color="#006269" />
          <Text className="text-lg font-bold text-content-primary ml-2">Inventory</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onRefresh}
            className="p-2 bg-canvas rounded-full mr-2"
            accessibilityLabel="Refresh"
          >
            <RefreshCcw color="#4B636B" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Items')}
            className="bg-brand px-3 py-1.5 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Manage items"
          >
            <Text className="text-surface text-sm font-semibold">Manage items</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-surface border-b border-border flex-row px-2 pt-2">
        {SEGMENTS.map((s) => {
          const active = segment === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSegment(s.id)}
              className={`flex-1 py-2.5 items-center border-b-2 ${
                active ? 'border-brand' : 'border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-brand' : 'text-content-secondary'
                }`}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <InventoryFilters
        segment={segment}
        filters={filters}
        parties={partiesQ.data || []}
        items={itemsQ.data || []}
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <View className="px-4 py-2 flex-row justify-between items-center">
        <Text className="text-xs text-content-secondary">{summary}</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={['#006269']} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View className="mt-8" accessibilityLabel="Loading inventory">
            {[0, 1, 2].map((i) => (
              <View key={i} className="h-20 bg-surface border border-border rounded-xl mb-3 opacity-60" />
            ))}
            <ActivityIndicator size="large" color="#006269" className="mt-4" />
          </View>
        ) : isError ? (
          <View className="py-12 items-center">
            <Text className="text-status-error text-center mb-3">{errorMsg}</Text>
            <TouchableOpacity onPress={onRefresh} className="bg-brand px-4 py-2 rounded-md">
              <Text className="text-surface font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : segment === 'stock' ? (
          <StockList rows={stockRows} onPressRow={openStockItem} />
        ) : segment === 'parties' ? (
          <PartyList
            parties={partyRows}
            onPressParty={(party) => navigation.navigate('PartyLedger', { party })}
          />
        ) : segment === 'purchases' ? (
          <BillList
            bills={purchaseRows}
            kind="purchase"
            onOpenBill={(bill) => navigation.navigate('NewPurchase', { editData: bill })}
          />
        ) : (
          <BillList
            bills={saleRows}
            kind="sale"
            onOpenBill={(bill) => navigation.navigate('NewSale', { editData: bill })}
          />
        )}
      </ScrollView>
    </View>
  );
}
