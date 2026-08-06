import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { toLocalYMD as toYMD, formatDisplayDate } from '../../utils/dateUtils';
import type { Item, Party, PartyType } from '../../types';

export type InventorySegment = 'stock' | 'parties' | 'purchases' | 'sales';

export type InventoryFilterState = {
  dateFrom: string;
  dateTo: string;
  partyId: string;
  itemId: string;
  partyType: '' | PartyType;
};

type Props = {
  segment: InventorySegment;
  filters: InventoryFilterState;
  parties: Party[];
  items: Item[];
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: InventoryFilterState) => void;
  onClear: () => void;
};


function activeCount(filters: InventoryFilterState, segment: InventorySegment): number {
  let n = 0;
  if (segment === 'purchases' || segment === 'sales') {
    if (filters.dateFrom) n += 1;
    if (filters.dateTo) n += 1;
    if (filters.partyId) n += 1;
    if (filters.itemId) n += 1;
  } else if (segment === 'parties') {
    if (filters.partyId) n += 1;
    if (filters.partyType) n += 1;
  } else if (filters.itemId) {
    n += 1;
  }
  return n;
}

export const EMPTY_FILTERS: InventoryFilterState = {
  dateFrom: '',
  dateTo: '',
  partyId: '',
  itemId: '',
  partyType: '',
};

export default function InventoryFilters({
  segment,
  filters,
  parties,
  items,
  expanded,
  onToggle,
  onChange,
  onClear,
}: Props) {
  const [picking, setPicking] = React.useState<'from' | 'to' | null>(null);
  const count = activeCount(filters, segment);
  const showDates = segment === 'purchases' || segment === 'sales';
  const showParty = segment !== 'stock';
  const showItem = segment !== 'parties';
  const showPartyType = segment === 'parties';

  return (
    <View className="bg-surface border-b border-border relative">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onToggle}
          className="flex-row items-center flex-1"
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide filters' : 'Show filters'}
        >
          <Text className="text-sm font-semibold text-content-primary">Filters</Text>
          {count > 0 ? (
            <View className="ml-2 bg-brand-muted px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-brand">{count} active</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <View className="flex-row items-center">
          {count > 0 ? (
            <TouchableOpacity
              onPress={onClear}
              className="mr-3 flex-row items-center"
              accessibilityLabel="Clear filters"
            >
              <X size={14} color="#4B636B" />
              <Text className="text-xs text-content-secondary ml-1">Clear</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={onToggle} accessibilityLabel={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronUp size={18} color="#4B636B" /> : <ChevronDown size={18} color="#4B636B" />}
          </TouchableOpacity>
        </View>
      </View>

      {expanded ? (
        <View className="px-4 pb-4">
          {showDates ? (
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text className="text-xs text-content-secondary mb-1">From</Text>
                <TouchableOpacity
                  onPress={() => setPicking('from')}
                  className="border border-border rounded-md px-3 py-2.5 bg-canvas"
                  accessibilityLabel="Filter from date"
                >
                  <Text className="text-content-primary text-sm">{filters.dateFrom ? formatDisplayDate(filters.dateFrom) : 'Any'}</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-content-secondary mb-1">To</Text>
                <TouchableOpacity
                  onPress={() => setPicking('to')}
                  className="border border-border rounded-md px-3 py-2.5 bg-canvas"
                  accessibilityLabel="Filter to date"
                >
                  <Text className="text-content-primary text-sm">{filters.dateTo ? formatDisplayDate(filters.dateTo) : 'Any'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {showPartyType ? (
            <View className="mb-3">
              <Text className="text-xs text-content-secondary mb-1">Party type</Text>
              <View className="flex-row">
                {(
                  [
                    { id: '', label: 'All' },
                    { id: 'SUPPLIER', label: 'Purchasers' },
                    { id: 'CUSTOMER', label: 'Customers' },
                  ] as const
                ).map((opt) => {
                  const active = filters.partyType === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id || 'all'}
                      onPress={() => onChange({ ...filters, partyType: opt.id })}
                      className={`mr-2 px-3 py-1.5 rounded-full border ${
                        active ? 'bg-brand border-brand' : 'bg-canvas border-border'
                      }`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text className={`text-xs font-semibold ${active ? 'text-surface' : 'text-content-secondary'}`}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {showParty ? (
            <View className="mb-3">
              <Text className="text-xs text-content-secondary mb-1">Party</Text>
              <View className="border border-border rounded-md bg-canvas">
                <Picker
                  selectedValue={filters.partyId}
                  onValueChange={(v) => onChange({ ...filters, partyId: String(v) })}
                  accessibilityLabel="Filter by party"
                >
                  <Picker.Item label="All parties" value="" />
                  {parties.map((p) => (
                    <Picker.Item
                      key={p.id}
                      label={`${p.name}${p.type === 'SUPPLIER' ? ' · Purchaser' : ' · Customer'}`}
                      value={p.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          ) : null}

          {showItem ? (
            <View className="mb-3">
              <Text className="text-xs text-content-secondary mb-1">Item</Text>
              <View className="border border-border rounded-md bg-canvas">
                <Picker
                  selectedValue={filters.itemId}
                  onValueChange={(v) => onChange({ ...filters, itemId: String(v) })}
                  accessibilityLabel="Filter by item"
                >
                  <Picker.Item label="All items" value="" />
                  {items.map((it) => (
                    <Picker.Item key={it.id} label={it.name_en} value={it.id} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : null}

          {picking && (
            <DateTimePicker
              value={
                picking === 'from' && filters.dateFrom
                  ? new Date(filters.dateFrom)
                  : picking === 'to' && filters.dateTo
                    ? new Date(filters.dateTo)
                    : new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={(_e, selected) => {
                setPicking(Platform.OS === 'ios' ? picking : null);
                if (!selected) return;
                const ymd = toYMD(selected);
                if (picking === 'from') onChange({ ...filters, dateFrom: ymd });
                else onChange({ ...filters, dateTo: ymd });
              }}
              onDismiss={() => setPicking(null)}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}
