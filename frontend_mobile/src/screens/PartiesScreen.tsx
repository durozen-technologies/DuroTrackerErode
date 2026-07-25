import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, RefreshCcw } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchParties } from '../api/resources';
import type { PartyType } from '../types';

type PartyTab = PartyType;

export default function PartiesScreen({ navigation }: any) {
  const [tab, setTab] = useState<PartyTab>('SUPPLIER');
  const [search, setSearch] = useState('');

  const { data: parties, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['parties', tab],
    queryFn: () => fetchParties(tab),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties || [];
    return (parties || []).filter((p: any) =>
      [p.name, p.company_name, p.mobile, p.address]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [parties, search]);

  const tabLabel = tab === 'SUPPLIER' ? 'Purchaser' : 'Customer';

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-900">Parties</Text>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => refetch()} className="p-2 bg-gray-100 rounded-full mr-2">
            <RefreshCcw color="#374151" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewParty', { partyType: tab })}
            className="bg-[#006269] flex-row items-center px-3 py-1.5 rounded-full"
          >
            <Plus color="white" size={16} />
            <Text className="text-white text-sm font-semibold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-4 bg-white border-b border-gray-200">
        <View className="relative justify-center">
          <View className="absolute left-3 z-10">
            <Search color="#9ca3af" size={20} />
          </View>
          <TextInput
            placeholder={`Search ${tabLabel.toLowerCase()}s...`}
            value={search}
            onChangeText={setSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
          />
        </View>
      </View>

      <View className="flex-row border-b border-gray-200 bg-white">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${tab === 'SUPPLIER' ? 'border-b-2 border-[#006269]' : ''}`}
          onPress={() => setTab('SUPPLIER')}
        >
          <Text className={`text-sm font-semibold ${tab === 'SUPPLIER' ? 'text-[#006269]' : 'text-gray-500'}`}>
            Purchasers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${tab === 'CUSTOMER' ? 'border-b-2 border-[#006269]' : ''}`}
          onPress={() => setTab('CUSTOMER')}
        >
          <Text className={`text-sm font-semibold ${tab === 'CUSTOMER' ? 'text-[#006269]' : 'text-gray-500'}`}>
            Customers
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#006269']} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#006269" className="mt-10" />
        ) : isError ? (
          <Text className="text-center text-red-500 mt-10">Error: {(error as any)?.message}</Text>
        ) : filtered.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No {tabLabel.toLowerCase()}s found.</Text>
        ) : (
          filtered.map((party: any) => (
            <TouchableOpacity
              key={party.id}
              onPress={() => navigation.navigate('PartyLedger', { party })}
              className="bg-white p-4 rounded-xl border border-gray-200 flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3">
                  <Text className="text-gray-700 font-bold text-lg">
                    {party.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 text-base">{party.name}</Text>
                  {party.company_name ? (
                    <Text className="text-xs text-gray-500 mt-0.5">{party.company_name}</Text>
                  ) : null}
                  <Text className="text-xs text-gray-500 mt-1">{party.mobile || 'No phone'}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold text-[#006269]">
                  ₹{Math.abs(Number(party.current_balance) || 0).toLocaleString()}
                </Text>
                <Text className="text-[10px] text-gray-500 mt-1">Pending</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
