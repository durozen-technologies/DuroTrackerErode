import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Package } from 'lucide-react-native';
import type { InventoryReportRow } from '../../types';

function formatQty(n: number) {
  return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 pr-3 mb-3">
      <Text className="text-[10px] font-medium text-content-secondary mb-0.5">{label}</Text>
      <Text className="text-sm font-semibold text-content-primary">{value}</Text>
    </View>
  );
}

export function InventoryItemCard({
  row,
}: {
  row: InventoryReportRow;
}) {
  const unit = row.unit_type === 'KG' ? 'kg' : 'unit';
  const showCount = Number(row.purchased_count) > 0 || Number(row.sold_count) > 0;
  const a11y = `${row.name_en}, available ${row.available_stock} ${unit}${
    showCount ? `, count ${row.available_count}` : ''
  }`;

  const body = (
    <>
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-lg bg-brand-muted items-center justify-center mr-3">
          <Package color="#006269" size={20} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-content-primary" numberOfLines={1}>
            {row.name_en}
          </Text>
          <Text className="text-xs text-content-secondary mt-0.5" numberOfLines={1}>
            {row.name_ta} · {row.unit_type}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap border-t border-border pt-3">
        <MetricCell label={`Available (${unit})`} value={formatQty(row.available_stock)} />
        {showCount ? (
          <MetricCell label="Available count" value={formatQty(row.available_count)} />
        ) : null}
      </View>
    </>
  );


  return (
    <View
      className="bg-surface border border-border rounded-xl p-4 mb-3"
      accessibilityRole="summary"
      accessibilityLabel={a11y}
    >
      {body}
    </View>
  );
}
