import React, { useEffect, useState } from 'react';
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
import { Plus, Package, RefreshCcw, X, ArrowLeft } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import { fetchItems, createItem, updateItem } from '../api/resources';

export default function ItemsScreen({ navigation, route }: any) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    name_ta: '',
    name_en: '',
    unit_type: 'KG',
  });

  const { data: items, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['items'],
    queryFn: () => fetchItems(),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ name_ta: '', name_en: '', unit_type: 'KG' });
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name_ta: item.name_ta,
      name_en: item.name_en,
      unit_type: item.unit_type,
    });
    setModalOpen(true);
  };

  useEffect(() => {
    const incoming = route.params?.editItem;
    if (incoming) {
      openEdit(incoming);
      navigation.setParams?.({ editItem: undefined });
    }
  }, [route.params?.editItem]);

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (editItem?.id) return updateItem(editItem.id, payload);
      return createItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-report'] });
      setModalOpen(false);
      setEditItem(null);
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      Alert.alert('Error', typeof detail === 'string' ? detail : 'Failed to save item');
    },
  });

  const save = () => {
    if (!form.name_en.trim() || !form.name_ta.trim()) {
      Alert.alert('Error', 'Tamil and English names are required');
      return;
    }
    mutation.mutate({
      name_ta: form.name_ta.trim(),
      name_en: form.name_en.trim(),
      unit_type: form.unit_type,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="px-4 py-3 bg-surface border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#132B32" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-content-primary">Items</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => refetch()} className="p-2 bg-canvas rounded-full mr-2">
            <RefreshCcw color="#4B636B" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openCreate}
            className="bg-brand flex-row items-center px-3 py-1.5 rounded-full"
          >
            <Plus color="white" size={16} />
            <Text className="text-surface text-sm font-semibold ml-1">Add</Text>
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
          <Text className="text-center text-content-secondary mt-10">
            No items yet. Add Chicken, Egg, Feed…
          </Text>
        ) : (
          items.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => openEdit(item)}
              className="bg-surface p-4 rounded-xl border border-border mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-lg bg-brand-muted items-center justify-center mr-3">
                    <Package color="#006269" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-content-primary">{item.name_en}</Text>
                    <Text className="text-xs text-content-secondary">
                      {item.name_ta} · {item.unit_type}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-brand">{item.available_stock}</Text>
                  <Text className="text-[10px] text-content-tertiary">Available</Text>
                </View>
              </View>
              <Text className="text-xs text-content-secondary mt-3">Used: {item.used_stock}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-surface rounded-t-2xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-content-primary">
                {editItem ? 'Edit Item' : 'New Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} accessibilityLabel="Close">
                <X color="#4B636B" size={22} />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-content-secondary mb-1">Name (Tamil) *</Text>
            <TextInput
              value={form.name_ta}
              onChangeText={(v) => setForm({ ...form, name_ta: v })}
              className="border border-border rounded-md px-3 py-2 mb-3 bg-canvas text-content-primary"
            />
            <Text className="text-xs text-content-secondary mb-1">Name (English) *</Text>
            <TextInput
              value={form.name_en}
              onChangeText={(v) => setForm({ ...form, name_en: v })}
              className="border border-border rounded-md px-3 py-2 mb-3 bg-canvas text-content-primary"
            />
            <Text className="text-xs text-content-secondary mb-1">Unit Type</Text>
            <View className="border border-border rounded-md mb-4 bg-canvas">
              <Picker selectedValue={form.unit_type} onValueChange={(v) => setForm({ ...form, unit_type: v })}>
                <Picker.Item label="Kg" value="KG" />
                <Picker.Item label="Unit" value="UNIT" />
              </Picker>
            </View>
            <TouchableOpacity onPress={save} className="bg-brand py-3 rounded-md items-center">
              <Text className="text-surface font-semibold">
                {mutation.isPending ? 'Saving...' : 'Save Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
