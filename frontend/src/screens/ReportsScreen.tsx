import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Printer } from 'lucide-react-native';
import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchReport } from '../api/resources';
import { toLocalYMD as toYMD } from '../utils/dateUtils';
import { exportReportToPdf } from '../utils/pdfReport';
import { OverallReportView, type OverallReportData } from '../components/reports/OverallReportView';
import { InventoryItemCard } from '../components/inventory/InventoryItemCard';

type ReportType = 'Overall' | 'Purchases' | 'Sales' | 'Inventory' | 'Expenses' | 'Outstanding';
type GroupBy = 'date' | 'party' | 'item' | 'category';


export default function ReportsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<ReportType>('Overall');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const today = toYMD(new Date());
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toYMD(d);
  })();
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);
  const [exporting, setExporting] = useState(false);

  const endpoint = useMemo(() => {
    const q = `from=${dateFrom}&to=${dateTo}`;
    switch (activeTab) {
      case 'Purchases':
        return `/reports/purchases?${q}&group_by=${groupBy === 'category' ? 'date' : groupBy}`;
      case 'Sales':
        return `/reports/sales?${q}&group_by=${groupBy === 'category' ? 'date' : groupBy}`;
      case 'Inventory':
        return `/reports/inventory`;
      case 'Expenses':
        return `/reports/expenses?${q}&group_by=${groupBy === 'party' || groupBy === 'item' ? 'date' : groupBy === 'category' ? 'category' : 'date'}`;
      case 'Outstanding':
        return `/reports/outstanding`;
      default:
        return null;
    }
  }, [activeTab, groupBy, dateFrom, dateTo]);

  // Single-tab fetch (skipped for Overall — useQueries below)
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', endpoint],
    queryFn: () => fetchReport(endpoint!),
    enabled: activeTab !== 'Overall' && !!endpoint,
  });

  // Overall: parallel fetches, shared query keys with individual tabs for cache reuse
  const overallEndpoints = useMemo(() => {
    const q = `from=${dateFrom}&to=${dateTo}`;
    return {
      purchases: `/reports/purchases?${q}&group_by=date`,
      sales: `/reports/sales?${q}&group_by=date`,
      expenses: `/reports/expenses?${q}&group_by=date`,
      inventory: `/reports/inventory`,
      outstanding: `/reports/outstanding`,
    };
  }, [dateFrom, dateTo]);

  const overallQueries = useQueries({
    queries: [
      {
        queryKey: ['reports', overallEndpoints.purchases],
        queryFn: () => fetchReport(overallEndpoints.purchases),
        enabled: activeTab === 'Overall',
      },
      {
        queryKey: ['reports', overallEndpoints.sales],
        queryFn: () => fetchReport(overallEndpoints.sales),
        enabled: activeTab === 'Overall',
      },
      {
        queryKey: ['reports', overallEndpoints.expenses],
        queryFn: () => fetchReport(overallEndpoints.expenses),
        enabled: activeTab === 'Overall',
      },
      {
        queryKey: ['reports', overallEndpoints.inventory],
        queryFn: () => fetchReport(overallEndpoints.inventory),
        enabled: activeTab === 'Overall',
      },
      {
        queryKey: ['reports', overallEndpoints.outstanding],
        queryFn: () => fetchReport(overallEndpoints.outstanding),
        enabled: activeTab === 'Overall',
      },
    ],
  });

  const overallLoading = overallQueries.some((q) => q.isLoading);
  const overallError = overallQueries.some((q) => q.isError);
  const overallData: OverallReportData = {
    purchases: overallQueries[0].data,
    sales: overallQueries[1].data,
    expenses: overallQueries[2].data,
    inventory: overallQueries[3].data,
    outstanding: overallQueries[4].data,
  };
  const overallReady = overallQueries.every((q) => q.isSuccess);

  const tabs: ReportType[] = ['Overall', 'Purchases', 'Sales', 'Inventory', 'Expenses', 'Outstanding'];
  const groupOptions: GroupBy[] =
    activeTab === 'Expenses'
      ? ['date', 'category']
      : activeTab === 'Purchases' || activeTab === 'Sales'
        ? ['date', 'party', 'item']
        : [];

  const showDateFilters = activeTab === 'Overall' || (activeTab !== 'Inventory' && activeTab !== 'Outstanding');
  const exportDisabled =
    exporting ||
    (activeTab === 'Overall' ? overallLoading || !overallReady : isLoading || !data);

  const handleExport = async () => {
    if (exportDisabled) return;
    setExporting(true);
    try {
      if (activeTab === 'Overall') {
        await exportReportToPdf({
          activeTab: 'Overall',
          dateFrom,
          dateTo,
          groupBy: 'date',
          data: overallData,
        });
      } else {
        await exportReportToPdf({ activeTab, dateFrom, dateTo, groupBy, data });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="px-4 py-3 bg-surface border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3" accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-content-primary">Reports</Text>
        </View>
        <TouchableOpacity
          onPress={handleExport}
          disabled={exportDisabled}
          accessibilityRole="button"
          accessibilityLabel="Export PDF"
          className={`flex-row items-center px-3 py-1.5 rounded-lg border ${
            exportDisabled ? 'border-border bg-canvas' : 'border-gray-900 bg-gray-900'
          }`}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#9ca3af" />
          ) : (
            <Printer size={15} color={exportDisabled ? '#9ca3af' : '#ffffff'} />
          )}
          <Text className={`text-xs font-bold ml-1.5 ${exportDisabled ? 'text-gray-400' : 'text-white'}`}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-surface border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {tabs.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setActiveTab(t);
                setGroupBy('date');
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === t }}
              className={`px-4 py-3 ${activeTab === t ? 'border-b-2 border-brand' : ''}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === t ? 'text-brand' : 'text-content-tertiary'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showDateFilters && (
        <View className="px-4 py-3 bg-surface border-b border-border flex-row gap-2">
          <View className="flex-1">
            <Text className="text-[10px] text-content-tertiary mb-1">From</Text>
            <TextInput placeholderTextColor="#849CA5"
              value={dateFrom}
              onChangeText={setDateFrom}
              accessibilityLabel="From date"
              className="border border-border rounded-md px-2 py-1.5 text-sm text-content-primary"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-content-tertiary mb-1">To</Text>
            <TextInput placeholderTextColor="#849CA5"
              value={dateTo}
              onChangeText={setDateTo}
              accessibilityLabel="To date"
              className="border border-border rounded-md px-2 py-1.5 text-sm text-content-primary"
            />
          </View>
        </View>
      )}

      {groupOptions.length > 0 && (
        <View className="flex-row px-4 py-2 bg-surface border-b border-border">
          {groupOptions.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGroupBy(g)}
              accessibilityRole="button"
              accessibilityState={{ selected: groupBy === g }}
              className={`px-3 py-1.5 rounded-full mr-2 ${groupBy === g ? 'bg-brand' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-semibold capitalize ${groupBy === g ? 'text-white' : 'text-content-secondary'}`}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView className="flex-1 p-4">
        {activeTab === 'Overall' ? (
          <OverallReportView data={overallData} isLoading={overallLoading} error={overallError} />
        ) : isLoading ? (
          <ActivityIndicator size="large" color="#006269" className="mt-10" />
        ) : error ? (
          <Text className="text-red-500 text-center mt-10">Failed to load report</Text>
        ) : activeTab === 'Inventory' ? (
          (data || []).length === 0 ? (
            <Text className="text-sm text-content-secondary text-center mt-10">No inventory items.</Text>
          ) : (
            (data || []).map((row: any) => <InventoryItemCard key={row.item_id} row={row} />)
          )
        ) : activeTab === 'Outstanding' ? (
          (data || []).map((row: any) => (
            <View key={row.party_id} className="bg-surface border border-border rounded-xl p-4 mb-3">
              <Text className="font-bold text-content-primary">{row.name}</Text>
              <Text className="text-xs text-content-tertiary mb-2">
                {row.party_type === 'SUPPLIER' ? 'Purchaser' : 'Customer'}
                {row.company_name ? ` · ${row.company_name}` : ''}
              </Text>
              <Text className="text-sm text-content-secondary">Opening: ₹{Number(row.opening_balance).toLocaleString()}</Text>
              <Text className="text-sm text-content-secondary">
                {row.party_type === 'SUPPLIER' ? 'Purchases' : 'Bills'}: ₹
                {Number(row.bills_or_purchases).toLocaleString()}
              </Text>
              <Text className="text-sm text-content-secondary">Payments: ₹{Number(row.payments).toLocaleString()}</Text>
              <Text className="text-sm font-bold text-brand mt-1">
                Pending: ₹{Number(row.pending_amount).toLocaleString()}
              </Text>
            </View>
          ))
        ) : activeTab === 'Expenses' ? (
          <>
            {(data?.rows || []).map((row: any) => (
              <View key={row.key} className="bg-surface border border-border rounded-xl p-4 mb-3">
                <Text className="font-bold text-content-primary">{row.label}</Text>
                <Text className="text-sm text-content-secondary">Cash: ₹{Number(row.cash_amount).toLocaleString()}</Text>
                <Text className="text-sm text-content-secondary">UPI: ₹{Number(row.upi_amount).toLocaleString()}</Text>
                <Text className="text-sm font-semibold text-brand">
                  Total: ₹{Number(row.total_amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {data && (
              <View className="bg-brand rounded-xl p-4 mt-2">
                <Text className="text-white font-bold">
                  Total ₹{Number(data.total_amount).toLocaleString()} (Cash ₹
                  {Number(data.total_cash).toLocaleString()} · UPI ₹{Number(data.total_upi).toLocaleString()})
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {(data?.rows || []).map((row: any) => (
              <View key={row.key} className="bg-surface border border-border rounded-xl p-4 mb-3">
                <Text className="font-bold text-content-primary">{row.label}</Text>
                <Text className="text-sm text-content-secondary">Qty: {row.quantity}</Text>
                <Text className="text-sm text-content-secondary">Bills: {row.count}</Text>
                <Text className="text-sm font-semibold text-brand">
                  Amount: ₹{Number(row.amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {data && (
              <View className="bg-brand rounded-xl p-4 mt-2">
                <Text className="text-white font-bold">
                  Total qty {data.total_quantity} · ₹{Number(data.total_amount).toLocaleString()}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
