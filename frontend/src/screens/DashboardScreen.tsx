import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  BarChart2,
  Users,
  Truck,
  FileText,
  Package,
  Tag,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { fetchDashboardStats } from '../api/resources';
import { toLocalYMD as toYMD, formatDisplayDate, parseDisplayDateToApi } from '../utils/dateUtils';


type ChipType = 'today' | 'week' | 'month' | 'custom';

function rangeFor(chip: 'today' | 'week' | 'month') {
  const today = new Date();
  if (chip === 'today') return { from: toYMD(today), to: toYMD(today) };
  if (chip === 'week') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toYMD(from), to: toYMD(today) };
  }
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  return { from: toYMD(from), to: toYMD(today) };
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [chip, setChip] = useState<ChipType>('today');
  const [customFrom, setCustomFrom] = useState(formatDisplayDate(toYMD(new Date())));
  const [customTo, setCustomTo] = useState(formatDisplayDate(toYMD(new Date())));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const range = useMemo(() => {
    if (chip === 'custom') return { from: parseDisplayDateToApi(customFrom), to: parseDisplayDateToApi(customTo) };
    return rangeFor(chip as any);
  }, [chip, customFrom, customTo]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats', range.from, range.to],
    queryFn: () => fetchDashboardStats(range.from, range.to),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-canvas justify-center items-center">
        <ActivityIndicator size="large" color="#006269" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-canvas justify-center items-center">
        <Text className="text-red-500 text-base mb-2">Failed to load dashboard data</Text>
      </View>
    );
  }

  const stats = data || {
    total_sales: 0,
    total_purchases: 0,
    total_expenses: 0,
    net_profit: 0,
    customer_outstanding: 0,
    supplier_outstanding: 0,
    inventory: [],
  };

  const Chip = ({ id, label }: { id: typeof chip; label: string }) => (
    <TouchableOpacity
      onPress={() => setChip(id)}
      className={`flex-1 py-2 rounded-md items-center justify-center ${chip === id ? 'bg-brand' : 'bg-surface border border-border'}`}
    >
      <Text className={`text-xs font-semibold ${chip === id ? 'text-surface' : 'text-content-secondary'}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-bold text-brand">Ledger Pro</Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.navigate('Reports')}
            className="flex-row items-center bg-brand-muted px-3 py-1.5 rounded-full"
          >
            <FileText size={18} color="#006269" />
            <Text className="ml-1 text-brand font-semibold text-sm">Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="flex-row justify-between gap-2 mb-6">
          <Chip id="today" label="Today" />
          <Chip id="week" label="Week" />
          <Chip id="month" label="Month" />
          <Chip id="custom" label="Custom" />
        </View>

        {chip === 'custom' && (
          <View className="flex-row gap-2 mb-6">
            <View className="flex-1">
              <Text className="text-[10px] text-content-tertiary mb-1">From</Text>
              <TouchableOpacity
                onPress={() => setShowFromPicker(true)}
                className="bg-surface border border-border rounded-md px-3 py-2 justify-center h-10"
              >
                <Text className="text-sm text-content-primary">{customFrom}</Text>
              </TouchableOpacity>
              {showFromPicker && (
                <DateTimePicker
                  value={new Date(parseDisplayDateToApi(customFrom))}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    setShowFromPicker(Platform.OS === 'ios');
                    if (d) setCustomFrom(formatDisplayDate(toYMD(d)));
                  }}
                  onDismiss={() => setShowFromPicker(false)}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-content-tertiary mb-1">To</Text>
              <TouchableOpacity
                onPress={() => setShowToPicker(true)}
                className="bg-surface border border-border rounded-md px-3 py-2 justify-center h-10"
              >
                <Text className="text-sm text-content-primary">{customTo}</Text>
              </TouchableOpacity>
              {showToPicker && (
                <DateTimePicker
                  value={new Date(parseDisplayDateToApi(customTo))}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    setShowToPicker(Platform.OS === 'ios');
                    if (d) setCustomTo(formatDisplayDate(toYMD(d)));
                  }}
                  onDismiss={() => setShowToPicker(false)}
                />
              )}
            </View>
          </View>
        )}

        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-surface p-4 rounded-xl border border-border mb-3 h-28 justify-between">
            <View className="flex-row justify-between items-start">
              <Text className="text-xs font-bold text-content-secondary">TOTAL SALES</Text>
              <TrendingUp color="#006269" size={16} />
            </View>
            <Text className="text-lg font-bold text-content-primary">₹{(stats.total_sales || 0).toLocaleString()}</Text>
          </View>
          <View className="w-[48%] bg-surface p-4 rounded-xl border border-border mb-3 h-28 justify-between">
            <View className="flex-row justify-between items-start">
              <Text className="text-xs font-bold text-content-secondary">PURCHASES</Text>
              <ShoppingCart color="#4B636B" size={16} />
            </View>
            <Text className="text-lg font-bold text-content-primary">₹{(stats.total_purchases || 0).toLocaleString()}</Text>
          </View>
          <View className="w-[48%] bg-surface p-4 rounded-xl border border-border mb-3 h-28 justify-between">
            <View className="flex-row justify-between items-start">
              <Text className="text-xs font-bold text-content-secondary">EXPENSES</Text>
              <Receipt color="#4B636B" size={16} />
            </View>
            <Text className="text-lg font-bold text-content-primary">₹{(stats.total_expenses || 0).toLocaleString()}</Text>
          </View>
          <View className="w-[48%] bg-brand p-4 rounded-xl mb-3 h-28 justify-between">
            <View className="flex-row justify-between items-start">
              <Text className="text-xs font-bold text-surface">NET BALANCE</Text>
              <BarChart2 color="white" size={16} />
            </View>
            <Text className="text-lg font-bold text-surface">₹{(stats.net_profit || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-content-primary mb-3">Quick Navigation</Text>
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Purchases')}
              className="flex-1 bg-surface p-4 rounded-xl border border-border items-center justify-center shadow-sm"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center mb-2">
                <ShoppingCart color="#4F46E5" size={24} />
              </View>
              <Text className="text-sm font-bold text-content-primary">Purchases</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Sales')}
              className="flex-1 bg-surface p-4 rounded-xl border border-border items-center justify-center shadow-sm"
            >
              <View className="w-12 h-12 rounded-full bg-brand-muted items-center justify-center mb-2">
                <Tag color="#006269" size={24} />
              </View>
              <Text className="text-sm font-bold text-content-primary">Sales</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Parties')}
              className="flex-1 bg-surface p-4 rounded-xl border border-border items-center justify-center shadow-sm"
            >
              <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center mb-2">
                <Users color="#D97706" size={24} />
              </View>
              <Text className="text-sm font-bold text-content-primary">Parties</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Expenses')}
              className="flex-1 bg-surface p-4 rounded-xl border border-border items-center justify-center shadow-sm"
            >
              <View className="w-12 h-12 rounded-full bg-rose-50 items-center justify-center mb-2">
                <Receipt color="#E11D48" size={24} />
              </View>
              <Text className="text-sm font-bold text-content-primary">Expenses</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Inventory')}
              className="flex-1 bg-surface p-4 rounded-xl border border-border flex-row items-center shadow-sm"
            >
              <View className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center mr-3">
                <Package color="#475569" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-content-primary">Inventory</Text>
                <Text className="text-xs text-content-secondary">Stock · parties · bills</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-content-primary mb-3">Outstanding</Text>
          <View className="bg-surface p-3 rounded-xl border border-border flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-status-warningBg items-center justify-center mr-3">
                <Users color="#D97706" size={20} />
              </View>
              <View>
                <Text className="text-xs font-semibold text-content-secondary">Customer Dues</Text>
                <Text className="text-base font-bold text-content-primary">
                  ₹{(stats.customer_outstanding || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
          <View className="bg-surface p-3 rounded-xl border border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-status-infoBg items-center justify-center mr-3">
                <Truck color="#0369A1" size={20} />
              </View>
              <View>
                <Text className="text-xs font-semibold text-content-secondary">Purchaser Payables</Text>
                <Text className="text-base font-bold text-content-primary">
                  ₹{(stats.supplier_outstanding || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>


        <View className="bg-surface p-4 rounded-xl border border-border mb-10">
          <Text className="text-lg font-bold text-content-primary mb-4">Inventory Overview</Text>
          {stats.inventory?.length ? (
            stats.inventory.map((item: any, index: number) => (
              <View key={index} className="mb-4">
                <Text className="text-sm font-bold text-content-primary">{item.item_name}</Text>
                <View className="flex-row justify-between items-end mt-2">
                  <View>
                    <Text className="text-xs font-semibold text-content-secondary">Available</Text>
                    <Text className="text-lg font-bold text-brand">{item.available_stock}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-semibold text-content-secondary">Used</Text>
                    <Text className="text-lg font-bold text-content-primary">{item.used_stock}</Text>
                  </View>
                </View>
                {index < stats.inventory.length - 1 && <View className="h-px bg-border my-3 w-full" />}
              </View>
            ))
          ) : (
            <Text className="text-content-secondary text-center py-4">No inventory items found</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
