import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

type ReportType = 'Purchases' | 'Sales' | 'Inventory' | 'Expenses' | 'Outstanding';
type GroupBy = 'date' | 'party' | 'item' | 'category';

function toYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function ReportsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<ReportType>('Purchases');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const today = toYMD(new Date());
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toYMD(d);
  })();
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);

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
        return `/reports/purchases?${q}`;
    }
  }, [activeTab, groupBy, dateFrom, dateTo]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', endpoint],
    queryFn: async () => (await client.get(endpoint)).data,
  });

  const tabs: ReportType[] = ['Purchases', 'Sales', 'Inventory', 'Expenses', 'Outstanding'];
  const groupOptions: GroupBy[] =
    activeTab === 'Expenses'
      ? ['date', 'category']
      : activeTab === 'Purchases' || activeTab === 'Sales'
        ? ['date', 'party', 'item']
        : [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Reports</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-200 px-2">
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => {
              setActiveTab(t);
              setGroupBy(t === 'Expenses' ? 'date' : 'date');
            }}
            className={`px-4 py-3 ${activeTab === t ? 'border-b-2 border-[#006269]' : ''}`}
          >
            <Text className={`text-sm font-semibold ${activeTab === t ? 'text-[#006269]' : 'text-gray-500'}`}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab !== 'Inventory' && activeTab !== 'Outstanding' && (
        <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row gap-2">
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 mb-1">From</Text>
            <TextInput value={dateFrom} onChangeText={setDateFrom} className="border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 mb-1">To</Text>
            <TextInput value={dateTo} onChangeText={setDateTo} className="border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
          </View>
        </View>
      )}

      {groupOptions.length > 0 && (
        <View className="flex-row px-4 py-2 bg-white border-b border-gray-100">
          {groupOptions.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGroupBy(g)}
              className={`px-3 py-1.5 rounded-full mr-2 ${groupBy === g ? 'bg-[#006269]' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-semibold capitalize ${groupBy === g ? 'text-white' : 'text-gray-600'}`}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <ActivityIndicator size="large" color="#006269" className="mt-10" />
        ) : error ? (
          <Text className="text-red-500 text-center mt-10">Failed to load report</Text>
        ) : activeTab === 'Inventory' ? (
          (data || []).map((row: any) => (
            <View key={row.item_id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              <Text className="font-bold text-gray-900">
                {row.name_en} ({row.name_ta})
              </Text>
              <Text className="text-xs text-gray-500 mb-2">{row.unit_type}</Text>
              <Text className="text-sm text-gray-700">Available: {row.available_stock}</Text>
              <Text className="text-sm text-gray-700">Used: {row.used_stock}</Text>
              <Text className="text-sm text-gray-700">Purchased: {row.purchased_quantity}</Text>
              <Text className="text-sm text-gray-700">Sold: {row.sold_quantity}</Text>
            </View>
          ))
        ) : activeTab === 'Outstanding' ? (
          (data || []).map((row: any) => (
            <View key={row.party_id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              <Text className="font-bold text-gray-900">{row.name}</Text>
              <Text className="text-xs text-gray-500 mb-2">
                {row.party_type === 'SUPPLIER' ? 'Purchaser' : 'Customer'}
                {row.company_name ? ` · ${row.company_name}` : ''}
              </Text>
              <Text className="text-sm text-gray-700">Opening: ₹{Number(row.opening_balance).toLocaleString()}</Text>
              <Text className="text-sm text-gray-700">
                {row.party_type === 'SUPPLIER' ? 'Purchases' : 'Bills'}: ₹
                {Number(row.bills_or_purchases).toLocaleString()}
              </Text>
              <Text className="text-sm text-gray-700">Payments: ₹{Number(row.payments).toLocaleString()}</Text>
              <Text className="text-sm font-bold text-[#006269] mt-1">
                Pending: ₹{Number(row.pending_amount).toLocaleString()}
              </Text>
            </View>
          ))
        ) : activeTab === 'Expenses' ? (
          <>
            {(data?.rows || []).map((row: any) => (
              <View key={row.key} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                <Text className="font-bold text-gray-900">{row.label}</Text>
                <Text className="text-sm text-gray-700">Cash: ₹{Number(row.cash_amount).toLocaleString()}</Text>
                <Text className="text-sm text-gray-700">UPI: ₹{Number(row.upi_amount).toLocaleString()}</Text>
                <Text className="text-sm font-semibold text-[#006269]">
                  Total: ₹{Number(row.total_amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {data && (
              <View className="bg-[#006269] rounded-xl p-4 mt-2">
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
              <View key={row.key} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                <Text className="font-bold text-gray-900">{row.label}</Text>
                <Text className="text-sm text-gray-700">Qty: {row.quantity}</Text>
                <Text className="text-sm text-gray-700">Bills: {row.count}</Text>
                <Text className="text-sm font-semibold text-[#006269]">
                  Amount: ₹{Number(row.amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {data && (
              <View className="bg-[#006269] rounded-xl p-4 mt-2">
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
