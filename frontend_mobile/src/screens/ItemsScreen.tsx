import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Package, RefreshCcw, X } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import client from '../api/client';

export default function ItemsScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    name_ta: '',
    name_en: '',
    unit_type: 'KG',
    minimum_stock: '0',
  });

  const { data: items, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['items'],
    queryFn: async () => (await client.get('/items/')).data,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (editItem?.id) return client.put(`/items/${editItem.id}`, payload);
      return client.post('/items/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setModalOpen(false);
      setEditItem(null);
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.detail || 'Failed to save item'),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ name_ta: '', name_en: '', unit_type: 'KG', minimum_stock: '0' });
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name_ta: item.name_ta,
      name_en: item.name_en,
      unit_type: item.unit_type,
      minimum_stock: String(item.minimum_stock ?? 0),
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name_en.trim() || !form.name_ta.trim()) {
      Alert.alert('Error', 'Tamil and English names are required');
      return;
    }
    mutation.mutate({
      name_ta: form.name_ta.trim(),
      name_en: form.name_en.trim(),
      unit_type: form.unit_type,
      minimum_stock: parseFloat(form.minimum_stock) || 0,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text className="text-[#006269] font-semibold">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Items</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => refetch()} className="p-2 bg-gray-100 rounded-full mr-2">
            <RefreshCcw color="#374151" size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openCreate} className="bg-[#006269] flex-row items-center px-3 py-1.5 rounded-full">
            <Plus color="white" size={16} />
            <Text className="text-white text-sm font-semibold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#006269']} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#006269" className="mt-10" />
        ) : !items?.length ? (
          <Text className="text-center text-gray-500 mt-10">No items yet. Add Chicken, Egg, Feed…</Text>
        ) : (
          items.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => openEdit(item)}
              className="bg-white p-4 rounded-xl border border-gray-200 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-lg bg-green-50 items-center justify-center mr-3">
                    <Package color="#006269" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{item.name_en}</Text>
                    <Text className="text-xs text-gray-500">{item.name_ta} · {item.unit_type}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-[#006269]">{item.available_stock}</Text>
                  <Text className="text-[10px] text-gray-500">Available</Text>
                </View>
              </View>
              <View className="flex-row mt-3 justify-between">
                <Text className="text-xs text-gray-500">Used: {item.used_stock}</Text>
                <Text className="text-xs text-gray-500">Min: {item.minimum_stock}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">{editItem ? 'Edit Item' : 'New Item'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-gray-600 mb-1">Name (Tamil) *</Text>
            <TextInput
              value={form.name_ta}
              onChangeText={(v) => setForm({ ...form, name_ta: v })}
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Name (English) *</Text>
            <TextInput
              value={form.name_en}
              onChangeText={(v) => setForm({ ...form, name_en: v })}
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Unit Type</Text>
            <View className="border border-gray-300 rounded-md mb-3">
              <Picker selectedValue={form.unit_type} onValueChange={(v) => setForm({ ...form, unit_type: v })}>
                <Picker.Item label="Kg" value="KG" />
                <Picker.Item label="Unit" value="UNIT" />
              </Picker>
            </View>
            <Text className="text-xs text-gray-600 mb-1">Minimum / Reorder Level</Text>
            <TextInput
              keyboardType="numeric"
              value={form.minimum_stock}
              onChangeText={(v) => setForm({ ...form, minimum_stock: v })}
              className="border border-gray-300 rounded-md px-3 py-2 mb-4"
            />
            <TouchableOpacity onPress={save} className="bg-[#006269] py-3 rounded-md items-center">
              <Text className="text-white font-semibold">{mutation.isPending ? 'Saving...' : 'Save Item'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
