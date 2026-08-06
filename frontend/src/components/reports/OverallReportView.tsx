import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import type { AggregatedReport } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';

type ExpenseReport = {
  rows: { date: string; category_name: string; cash_amount: number; upi_amount: number; total_amount: number }[];
  total_cash: number;
  total_upi: number;
  total_amount: number;
};

export type OverallReportData = {
  purchases?: AggregatedReport;
  sales?: AggregatedReport;
  expenses?: ExpenseReport;
};

function money(n?: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <View className="mb-2 mt-1">
      <Text className="text-sm font-bold text-gray-900 tracking-wide uppercase">{title}</Text>
      {meta ? <Text className="text-xs text-gray-500 mt-0.5">{meta}</Text> : null}
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-2 border-b border-gray-100">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm font-semibold text-gray-900 ml-3 flex-shrink text-right">{value}</Text>
    </View>
  );
}

export function OverallReportView({
  data,
  isLoading,
  error,
}: {
  data: OverallReportData;
  isLoading: boolean;
  error: boolean;
}) {
  if (isLoading) {
    return <ActivityIndicator size="large" color="#006269" className="mt-10" />;
  }

  if (error) {
    return <Text className="text-red-500 text-center mt-10">Failed to load overall report</Text>;
  }

  const purchases = data.purchases;
  const sales = data.sales;
  const expenses = data.expenses;

  return (
    <View>
      <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
        <Text className="text-xs font-bold text-[#006269] uppercase tracking-wide mb-1">Period totals</Text>
        <SummaryLine
          label="Purchases"
          value={`${money(purchases?.total_amount)} · qty ${purchases?.total_quantity ?? 0}`}
        />
        <SummaryLine
          label="Sales"
          value={`${money(sales?.total_amount)} · qty ${sales?.total_quantity ?? 0}`}
        />
        <SummaryLine
          label="Expenses"
          value={`${money(expenses?.total_amount)} (cash ${money(expenses?.total_cash)} · UPI ${money(expenses?.total_upi)})`}
        />
      </View>

      <SectionTitle
        title="Purchases"
        meta={`Total ${money(purchases?.total_amount)} · qty ${purchases?.total_quantity ?? 0}`}
      />
      {(purchases?.rows || []).length === 0 ? (
        <Text className="text-sm text-gray-500 mb-4">No purchase activity in this period.</Text>
      ) : (
        (purchases?.rows || []).map((row) => (
          <View key={`p-${row.key}`} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
            <Text className="font-bold text-gray-900">{row.label}</Text>
            <Text className="text-sm text-gray-700">Qty: {row.quantity}</Text>
            <Text className="text-sm text-gray-700">Bills: {row.count}</Text>
            <Text className="text-sm font-semibold text-[#006269]">Amount: {money(row.amount)}</Text>
          </View>
        ))
      )}

      <SectionTitle title="Sales" meta={`Total ${money(sales?.total_amount)} · qty ${sales?.total_quantity ?? 0}`} />
      {(sales?.rows || []).length === 0 ? (
        <Text className="text-sm text-gray-500 mb-4">No sales activity in this period.</Text>
      ) : (
        (sales?.rows || []).map((row) => (
          <View key={`s-${row.key}`} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
            <Text className="font-bold text-gray-900">{row.label}</Text>
            <Text className="text-sm text-gray-700">Qty: {row.quantity}</Text>
            <Text className="text-sm text-gray-700">Bills: {row.count}</Text>
            <Text className="text-sm font-semibold text-[#006269]">Amount: {money(row.amount)}</Text>
          </View>
        ))
      )}

      <SectionTitle title="Expenses" meta={`Total ${money(expenses?.total_amount)}`} />
      {(expenses?.rows || []).length === 0 ? (
        <Text className="text-sm text-gray-500 mb-4">No expenses in this period.</Text>
      ) : (
        (expenses?.rows || []).map((row, i) => (
          <View key={`e-${i}`} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
            <Text className="font-bold text-gray-900">{formatDisplayDate(row.date)} - {row.category_name}</Text>
            <Text className="text-sm text-gray-700">Cash: {money(row.cash_amount)}</Text>
            <Text className="text-sm text-gray-700">UPI: {money(row.upi_amount)}</Text>
            <Text className="text-sm font-semibold text-[#006269]">Total: {money(row.total_amount)}</Text>
          </View>
        ))
      )}
    </View>
  );
}
