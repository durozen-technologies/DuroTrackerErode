import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, ShoppingCart, Tag } from 'lucide-react-native';
import type { Bill } from '../../types';

function formatMoney(n: number) {
  return `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

type Props = {
  bills: Bill[];
  kind: 'purchase' | 'sale';
  onOpenBill: (bill: Bill) => void;
};

export default function BillList({ bills, kind, onOpenBill }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const Icon = kind === 'purchase' ? ShoppingCart : Tag;
  const emptyLabel = kind === 'purchase' ? 'No purchases match' : 'No sales match';

  if (bills.length === 0) {
    return (
      <View className="py-12 items-center">
        <Icon size={36} color="#849CA5" />
        <Text className="text-sm font-medium text-content-primary mt-3">{emptyLabel}</Text>
        <Text className="text-xs text-content-secondary mt-1 text-center px-8">
          Try a wider date range or clear party/item filters.
        </Text>
      </View>
    );
  }

  return (
    <>
      {bills.map((bill) => {
        const open = expandedId === bill.id;
        const paid = Number(bill.cash_payment || 0) + Number(bill.upi_payment || 0);
        const due = Number(bill.balance_amount || 0);
        return (
          <View key={bill.id} className="bg-surface border border-border rounded-xl mb-3 overflow-hidden">
            <TouchableOpacity
              onPress={() => setExpandedId(open ? null : bill.id)}
              className="p-4"
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${bill.party_name || 'Party'} ${bill.date}, total ${bill.total_amount}`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start flex-1 mr-2">
                  <View className="w-10 h-10 rounded-lg bg-canvas items-center justify-center mr-3">
                    <Icon color="#4B636B" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-content-primary">
                      {bill.party_name || (kind === 'purchase' ? 'Purchaser' : 'Customer')}
                    </Text>
                    <Text className="text-xs text-content-secondary mt-0.5">{bill.date}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-brand">{formatMoney(bill.total_amount)}</Text>
                  {open ? <ChevronUp size={16} color="#849CA5" /> : <ChevronDown size={16} color="#849CA5" />}
                </View>
              </View>
              <View className="flex-row mt-3 justify-between">
                <Text className="text-xs text-content-secondary">Paid {formatMoney(paid)}</Text>
                <Text className={`text-xs font-medium ${due > 0 ? 'text-status-warning' : 'text-status-success'}`}>
                  Balance {formatMoney(due)}
                </Text>
              </View>
            </TouchableOpacity>

            {open ? (
              <View className="px-4 pb-4 border-t border-border pt-3">
                <Text className="text-xs font-semibold text-content-secondary mb-2">
                  Cash {formatMoney(bill.cash_payment)} · UPI {formatMoney(bill.upi_payment)}
                </Text>
                {(bill.items || []).length === 0 ? (
                  <Text className="text-xs text-content-tertiary mb-3">No line items</Text>
                ) : (
                  (bill.items || []).map((line, idx) => (
                    <View
                      key={line.id || `${bill.id}-${idx}`}
                      className="flex-row justify-between py-1.5 border-b border-border"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-sm text-content-primary">
                          {line.item_name_en || 'Item'}
                          {line.item_name_ta ? ` · ${line.item_name_ta}` : ''}
                        </Text>
                        <Text className="text-xs text-content-tertiary">
                          {Number(line.quantity).toLocaleString()} {line.unit_type || ''} ×{' '}
                          {formatMoney(line.rate)}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium text-content-primary">
                        {formatMoney(line.amount)}
                      </Text>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  onPress={() => onOpenBill(bill)}
                  className="mt-3 bg-brand py-2.5 rounded-md items-center"
                  accessibilityRole="button"
                  accessibilityLabel={kind === 'purchase' ? 'Open purchase' : 'Open sale'}
                >
                  <Text className="text-surface font-semibold text-sm">
                    {kind === 'purchase' ? 'Open purchase' : 'Open sale'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}
