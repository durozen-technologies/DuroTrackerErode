import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { fetchItems } from '../api/resources';

export default function NotificationsScreen({ navigation }: any) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => fetchItems(true),
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="px-4 py-3 bg-surface border-b border-border flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Bell size={20} color="#006269" />
        <Text className="text-lg font-bold text-content-primary ml-2">Notifications</Text>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#006269']} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#006269" className="mt-10" />
        ) : !data?.length ? (
          <Text className="text-center text-content-tertiary mt-10">No low stock alerts.</Text>
        ) : (
          data.map((item: any) => (
            <View key={item.id} className="bg-red-50 border border-red-100 rounded-xl p-4 mb-3">
              <Text className="text-red-800 font-bold text-base mb-1">Low Stock Alert</Text>
              <Text className="text-content-primary font-semibold">
                {item.name_en} ({item.name_ta})
              </Text>
              <Text className="text-sm text-content-secondary mt-2">
                Available: {item.available_stock} {item.unit_type}
              </Text>
              <Text className="text-sm text-content-secondary">Minimum: {item.minimum_stock} {item.unit_type}</Text>
              <Text className="text-sm text-red-700 mt-2 font-medium">Please reorder stock.</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
