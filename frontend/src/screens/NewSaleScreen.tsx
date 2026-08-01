import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import { fetchParties, fetchItems, createSale, updateSale, deleteSale } from '../api/resources';

type Line = {
  item_id: string;
  quantity: string;
  count: string;
  rate: string;
};

function emptyLine(): Line {
  return { item_id: '', quantity: '', count: '', rate: '' };
}

export default function NewSaleScreen({ navigation, route }: any) {
  const queryClient = useQueryClient();
  const editData = route.params?.editData;

  const [date, setDate] = useState(editData?.date || new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState(editData?.party_id || '');
  const [cash, setCash] = useState(String(editData?.cash_payment ?? ''));
  const [upi, setUpi] = useState(String(editData?.upi_payment ?? ''));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lines, setLines] = useState<Line[]>(
    editData?.items?.length
      ? editData.items.map((i: any) => ({
          item_id: i.item_id,
          quantity: String(i.quantity ?? ''),
          count: i.count != null ? String(i.count) : '',
          rate: String(i.rate ?? ''),
        }))
      : [emptyLine()]
  );

  const { data: parties } = useQuery({
    queryKey: ['parties', 'CUSTOMER'],
    queryFn: () => fetchParties('CUSTOMER'),
  });
  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: () => fetchItems(),
  });

  const itemMap = useMemo(() => {
    const m: Record<string, any> = {};
    (items || []).forEach((it: any) => {
      m[it.id] = it;
    });
    return m;
  }, [items]);

  const lineTotals = lines.map((l) => {
    const qty = parseFloat(l.quantity) || 0;
    const rate = parseFloat(l.rate) || 0;
    return Math.round(qty * rate * 100) / 100;
  });
  const totalAmount = lineTotals.reduce((a, b) => a + b, 0);
  const totalPaid = (parseFloat(cash) || 0) + (parseFloat(upi) || 0);
  const balance = Math.round((totalAmount - totalPaid) * 100) / 100;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['parties'] });
  };

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (editData?.id) return updateSale(editData.id, payload);
      return createSale(payload);
    },
    onSuccess: (res: any) => {
      invalidate();
      const alerts = res?.low_stock_alerts || [];
      if (alerts.length) {
        Alert.alert(
          'Saved — Low Stock',
          alerts.map((a: any) => `${a.item_name}: ${a.available} (min ${a.minimum})`).join('\n')
        );
      } else {
        Alert.alert('Success', 'Sale saved');
      }
      navigation.goBack();
    },
    onError: (error: any) => {
      const d = error?.response?.data?.detail;
      const msg =
        typeof d === 'string'
          ? d
          : d?.message || (d?.item_name ? `Insufficient stock for ${d.item_name}` : 'Failed to save sale');
      Alert.alert('Error', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSale(editData.id),
    onSuccess: () => {
      invalidate();
      navigation.goBack();
    },
  });

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleSave = () => {
    if (!partyId) {
      Alert.alert('Error', 'Select a customer');
      return;
    }
    const payloadItems = lines
      .filter((l) => l.item_id && parseFloat(l.quantity) > 0)
      .map((l) => ({
        item_id: l.item_id,
        quantity: parseFloat(l.quantity),
        count: itemMap[l.item_id]?.unit_type === 'KG' && l.count ? parseInt(l.count, 10) : null,
        rate: parseFloat(l.rate) || 0,
      }));
    if (!payloadItems.length) {
      Alert.alert('Error', 'Add at least one item line');
      return;
    }
    mutation.mutate({
      party_id: partyId,
      date,
      cash_payment: parseFloat(cash) || 0,
      upi_payment: parseFloat(upi) || 0,
      items: payloadItems,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">{editData ? 'Edit Sale' : 'New Sale'}</Text>
        </View>
        {editData && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Delete?', 'This restores stock and balance.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
              ])
            }
          >
            <Trash2 color="#dc2626" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xs font-medium text-gray-700 mb-1">Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="bg-white border border-gray-300 rounded-md px-3 py-2.5 mb-3"
        >
          <Text>{date}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (d) setDate(d.toISOString().split('T')[0]);
            }}
          />
        )}

        <Text className="text-xs font-medium text-gray-700 mb-1">Customer *</Text>
        <View className="bg-white border border-gray-300 rounded-md mb-4">
          <Picker selectedValue={partyId} onValueChange={setPartyId}>
            <Picker.Item label="Select customer" value="" />
            {(parties || []).map((p: any) => (
              <Picker.Item key={p.id} label={p.name} value={p.id} />
            ))}
          </Picker>
        </View>

        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold text-[#006269]">Items</Text>
          <TouchableOpacity onPress={() => setLines((p) => [...p, emptyLine()])} className="flex-row items-center">
            <Plus color="#006269" size={16} />
            <Text className="text-[#006269] text-sm ml-1">Add line</Text>
          </TouchableOpacity>
        </View>

        {lines.map((line, idx) => {
          const item = itemMap[line.item_id];
          const isKg = item?.unit_type === 'KG';
          return (
            <View key={idx} className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold text-gray-500">Line {idx + 1}</Text>
                {lines.length > 1 && (
                  <TouchableOpacity onPress={() => setLines((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 color="#dc2626" size={16} />
                  </TouchableOpacity>
                )}
              </View>
              <View className="border border-gray-300 rounded-md mb-2">
                <Picker selectedValue={line.item_id} onValueChange={(v) => updateLine(idx, { item_id: v })}>
                  <Picker.Item label="Select item" value="" />
                  {(items || []).map((it: any) => (
                    <Picker.Item
                      key={it.id}
                      label={`${it.name_en} · avail ${it.available_stock} ${it.unit_type}`}
                      value={it.id}
                    />
                  ))}
                </Picker>
              </View>
              {item && (
                <Text className="text-xs text-[#006269] mb-2">
                  Available stock: {item.available_stock} {item.unit_type}
                </Text>
              )}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-500 mb-1">{isKg ? 'Kg' : 'Units'}</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={line.quantity}
                    onChangeText={(v) => updateLine(idx, { quantity: v })}
                    className="border border-gray-300 rounded-md px-2 py-2"
                  />
                </View>
                {isKg && (
                  <View className="flex-1">
                    <Text className="text-[10px] text-gray-500 mb-1">Count</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={line.count}
                      onChangeText={(v) => updateLine(idx, { count: v })}
                      className="border border-gray-300 rounded-md px-2 py-2"
                    />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-500 mb-1">Selling Rate</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={line.rate}
                    onChangeText={(v) => updateLine(idx, { rate: v })}
                    className="border border-gray-300 rounded-md px-2 py-2"
                  />
                </View>
              </View>
              <Text className="text-right text-sm font-semibold text-gray-800 mt-2">
                ₹{lineTotals[idx].toLocaleString()}
              </Text>
            </View>
          );
        })}

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
          <Text className="text-sm font-semibold text-[#006269] mb-3">Payment</Text>
          <Text className="text-xs text-gray-500 mb-1">Cash Received</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={cash}
            onChangeText={setCash}
            className="border border-gray-300 rounded-md px-3 py-2 mb-2"
          />
          <Text className="text-xs text-gray-500 mb-1">UPI Received</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={upi}
            onChangeText={setUpi}
            className="border border-gray-300 rounded-md px-3 py-2 mb-3"
          />
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600">Bill Amount</Text>
            <Text className="font-bold">₹{totalAmount.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600">Received</Text>
            <Text className="font-bold">₹{totalPaid.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Customer Balance</Text>
            <Text className="font-bold text-[#006269]">₹{balance.toLocaleString()}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View className="absolute bottom-0 w-full bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          onPress={handleSave}
          disabled={mutation.isPending}
          className="bg-[#006269] py-3 rounded-md flex-row items-center justify-center"
        >
          <Save color="white" size={16} />
          <Text className="text-white font-semibold ml-2">{mutation.isPending ? 'Saving...' : 'Save Sale'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
