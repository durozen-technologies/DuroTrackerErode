import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Package, Users } from 'lucide-react-native';
import type { InventoryReportRow, Party } from '../../types';
import { InventoryItemCard } from './InventoryItemCard';

function formatMoney(n: number) {
  return `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function StockList({
  rows,
}: {
  rows: InventoryReportRow[];
}) {
  if (rows.length === 0) {
    return (
      <View className="py-12 items-center">
        <Package size={36} color="#849CA5" />
        <Text className="text-sm font-medium text-content-primary mt-3">No stock items</Text>
        <Text className="text-xs text-content-secondary mt-1 text-center px-8">
          Adjust filters or add items from Manage items.
        </Text>
      </View>
    );
  }

  return (
    <>
      {rows.map((row) => (
        <InventoryItemCard key={row.item_id} row={row} />
      ))}
    </>
  );
}

export function PartyList({
  parties,
  onPressParty,
}: {
  parties: Party[];
  onPressParty: (party: Party) => void;
}) {
  if (parties.length === 0) {
    return (
      <View className="py-12 items-center">
        <Users size={36} color="#849CA5" />
        <Text className="text-sm font-medium text-content-primary mt-3">No parties match</Text>
        <Text className="text-xs text-content-secondary mt-1 text-center px-8">
          Try clearing party or type filters.
        </Text>
      </View>
    );
  }

  return (
    <>
      {parties.map((party) => {
        const isSupplier = party.type === 'SUPPLIER';
        return (
          <TouchableOpacity
            key={party.id}
            onPress={() => onPressParty(party)}
            className="bg-surface border border-border rounded-xl p-4 mb-3"
            accessibilityRole="button"
            accessibilityLabel={`${party.name}, pending ${party.current_balance}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-1">
                  <Text className="font-semibold text-content-primary flex-shrink">{party.name}</Text>
                  <View
                    className={`ml-2 px-2 py-0.5 rounded-full ${
                      isSupplier ? 'bg-status-infoBg' : 'bg-brand-muted'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold ${
                        isSupplier ? 'text-status-info' : 'text-brand'
                      }`}
                    >
                      {isSupplier ? 'Purchaser' : 'Customer'}
                    </Text>
                  </View>
                </View>
                {party.company_name ? (
                  <Text className="text-xs text-content-secondary">{party.company_name}</Text>
                ) : null}
                <Text className="text-xs text-content-tertiary mt-0.5">{party.mobile || 'No phone'}</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold text-brand">{formatMoney(party.current_balance)}</Text>
                <Text className="text-[10px] text-content-tertiary">Pending</Text>
              </View>
            </View>
            <Text className="text-xs text-content-secondary mt-3">
              Opening unpaid {formatMoney(party.unpaid_opening_balance ?? 0)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}
