import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Printer } from 'lucide-react-native';
import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchReport, fetchDetailedPurchases, fetchDetailedSales } from '../api/resources';
import { toLocalYMD as toYMD, formatDisplayDate, parseDisplayDateToApi } from '../utils/dateUtils';
import { exportOverallPdf } from '../utils/pdf/exportOverallPdf';
import { exportDetailedPurchasesPdf } from '../utils/pdf/exportDetailedPurchasesPdf';
import { exportDetailedSalesPdf } from '../utils/pdf/exportDetailedSalesPdf';
import { exportSalesPdf } from '../utils/pdf/exportSalesPdf';
import { exportPurchasesPdf } from '../utils/pdf/exportPurchasesPdf';
import { exportExpensesPdf } from '../utils/pdf/exportExpensesPdf';
import { OverallReportView, type OverallReportData } from '../components/reports/OverallReportView';

type ReportType = 'Overall' | 'Purchases' | 'Sales' | 'Expenses';
type GroupBy = 'date' | 'party' | 'item' | 'category';


export default function ReportsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<ReportType>('Overall');
  const today = formatDisplayDate(toYMD(new Date()));
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDisplayDate(toYMD(d));
  })();
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);
  const [exporting, setExporting] = useState(false);

  const endpoint = useMemo(() => {
    const apiFrom = parseDisplayDateToApi(dateFrom);
    const apiTo = parseDisplayDateToApi(dateTo);
    const q = `from=${apiFrom}&to=${apiTo}`;
    switch (activeTab) {
      case 'Purchases':
        return `/reports/purchases?${q}&group_by=party`;
      case 'Sales':
        return `/reports/sales?${q}&group_by=party`;
      case 'Expenses':
        return `/reports/expenses?${q}`;
      default:
        return null;
    }
  }, [activeTab, dateFrom, dateTo]);

  // Single-tab fetch (skipped for Overall — useQueries below)
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', endpoint],
    queryFn: () => fetchReport(endpoint!),
    enabled: activeTab !== 'Overall' && !!endpoint,
  });

  const overallEndpoints = useMemo(() => {
    const apiFrom = parseDisplayDateToApi(dateFrom);
    const apiTo = parseDisplayDateToApi(dateTo);
    const q = `from=${apiFrom}&to=${apiTo}`;
    return {
      purchases: `/reports/purchases?${q}`,
      sales: `/reports/sales?${q}`,
      expenses: `/reports/expenses?${q}`,
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
    ],
  });

  const overallLoading = overallQueries.some((q) => q.isLoading);
  const overallError = overallQueries.some((q) => q.isError);
  const overallData: OverallReportData = {
    purchases: overallQueries[0].data,
    sales: overallQueries[1].data,
    expenses: overallQueries[2].data,
  };
  const overallReady = overallQueries.every((q) => q.isSuccess);

  const tabs: ReportType[] = ['Overall', 'Purchases', 'Sales', 'Expenses'];

  const showDateFilters = true;
  const exportDisabled =
    exporting ||
    (activeTab === 'Overall' ? overallLoading || !overallReady : isLoading || !data);

  const handleExport = async () => {
    if (exportDisabled) return;
    setExporting(true);
    try {
      if (activeTab === 'Overall') {
        await exportOverallPdf({ dateFrom, dateTo, data: overallData });
      } else if (activeTab === 'Purchases') {
        await exportPurchasesPdf({ dateFrom, dateTo, groupBy: 'party', data });
      } else if (activeTab === 'Sales') {
        await exportSalesPdf({ dateFrom, dateTo, groupBy: 'party', data });
      } else if (activeTab === 'Expenses') {
        await exportExpensesPdf({ dateFrom, dateTo, groupBy: 'date', data });
      }
    } finally {
      setExporting(false);
    }
  };

  const [exportingDetailed, setExportingDetailed] = useState<string | null>(null);

  const handlePartyClick = async (partyId: string, partyName: string) => {
    if (exportingDetailed) return;
    setExportingDetailed(partyId);
    try {
      const apiFrom = parseDisplayDateToApi(dateFrom);
      const apiTo = parseDisplayDateToApi(dateTo);
      if (activeTab === 'Purchases') {
        const detailedData = await fetchDetailedPurchases(partyId, apiFrom, apiTo);
        await exportDetailedPurchasesPdf({ dateFrom, dateTo, partyName, data: detailedData });
      } else if (activeTab === 'Sales') {
        const detailedData = await fetchDetailedSales(partyId, apiFrom, apiTo);
        await exportDetailedSalesPdf({ dateFrom, dateTo, partyName, data: detailedData });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || `Failed to fetch detailed ${activeTab.toLowerCase()}`);
    } finally {
      setExportingDetailed(null);
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
        
        {activeTab !== 'Purchases' && (
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
        )}
      </View>

      <View className="bg-surface border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {tabs.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setActiveTab(t);
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


      <ScrollView className="flex-1 p-4">
        {activeTab === 'Overall' ? (
          <OverallReportView data={overallData} isLoading={overallLoading} error={overallError} />
        ) : isLoading ? (
          <ActivityIndicator size="large" color="#006269" className="mt-10" />
        ) : error ? (
          <Text className="text-red-500 text-center mt-10">Failed to load report</Text>
        ) : activeTab === 'Expenses' ? (
          <>
            {(data?.rows || []).map((row: any, i: number) => (
              <View key={i} className="bg-surface border border-border rounded-xl p-4 mb-3 flex-row justify-between items-center">
                <View>
                  <Text className="font-bold text-content-primary">
                    {formatDisplayDate(row.date)}
                  </Text>
                  <Text className="text-sm font-medium text-content-secondary mt-1">
                    {row.category_name}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-xs text-content-secondary mr-3">Cash: ₹{Number(row.cash_amount).toLocaleString()}</Text>
                    <Text className="text-xs text-content-secondary">UPI: ₹{Number(row.upi_amount).toLocaleString()}</Text>
                  </View>
                </View>
                <Text className="text-base font-bold text-brand">
                  ₹{Number(row.total_amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {data && (
              <View className="bg-brand rounded-xl p-4 mt-2">
                <Text className="text-white font-bold">
                  Total ₹{Number(data.total_amount).toLocaleString()} (Cash ₹
                  {Number(data.total_cash).toLocaleString()} • UPI ₹{Number(data.total_upi).toLocaleString()})
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {(data?.rows || []).map((row: any) => (
              <TouchableOpacity 
                key={row.key} 
                className="bg-surface border border-border rounded-xl p-4 mb-3 flex-row justify-between items-center"
                onPress={() => (activeTab === 'Purchases' || activeTab === 'Sales') && handlePartyClick(row.key, row.label)}
                disabled={(activeTab !== 'Purchases' && activeTab !== 'Sales') || exportingDetailed === row.key}
              >
                <View>
                  <Text className="font-bold text-content-primary">
                    {row.label}
                  </Text>
                  <Text className="text-sm text-content-secondary">Qty: {row.quantity}</Text>
                  <Text className="text-sm text-content-secondary">Bills: {row.count}</Text>
                  <Text className="text-sm font-semibold text-brand">
                    Amount: ₹{Number(row.amount).toLocaleString()}
                  </Text>
                </View>
                {(activeTab === 'Purchases' || activeTab === 'Sales') && (
                  <View>
                    {exportingDetailed === row.key ? (
                      <ActivityIndicator size="small" color="#006269" />
                    ) : (
                      <Printer size={20} color="#006269" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
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
