import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, User } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createParty, updateParty } from '../api/resources';

type PartyType = 'SUPPLIER' | 'CUSTOMER';

export default function NewPartyScreen({ navigation, route }: any) {
  const queryClient = useQueryClient();
  const editData = route.params?.editData;
  const initialType: PartyType = editData?.type || route.params?.partyType || 'SUPPLIER';
  const [tab, setTab] = useState<PartyType>(initialType);

  const [form, setForm] = useState({
    name: editData?.name || '',
    company_name: editData?.company_name || '',
    mobile: editData?.mobile || '',
    address: editData?.address || '',
    opening_balance: String(editData?.opening_balance ?? '0'),
    is_active: editData?.is_active ?? true,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (editData?.id) return updateParty(editData.id, payload);
      return createParty(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      if (editData?.id) {
        queryClient.invalidateQueries({ queryKey: ['partyLedger', editData.id] });
      }
      Alert.alert('Success', editData ? 'Party updated' : 'Party added');
      navigation.goBack();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      let msg = 'Failed to save party';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((e: any) => e.msg).join(', ');
      Alert.alert('Error', msg);
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!form.mobile.trim()) {
      Alert.alert('Error', 'Mobile number is required');
      return;
    }
    const payload: any = {
      name: form.name.trim(),
      company_name: form.company_name.trim() || null,
      mobile: form.mobile.trim(),
      address: form.address.trim() || null,
      opening_balance: parseFloat(form.opening_balance) || 0,
      is_active: form.is_active,
    };
    if (!editData) payload.type = tab;
    mutation.mutate(payload);
  };

  const companyLabel = tab === 'SUPPLIER' ? 'Company Name' : 'Shop Name';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          {editData ? 'Edit Party' : 'Add Party'}
        </Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        {!editData && (
          <View className="flex-row border border-gray-200 rounded-lg mb-6 overflow-hidden bg-white">
            <TouchableOpacity
              className={`flex-1 py-3 items-center ${tab === 'SUPPLIER' ? 'bg-[#006269]' : 'bg-white'}`}
              onPress={() => setTab('SUPPLIER')}
            >
              <Text className={`text-sm font-semibold ${tab === 'SUPPLIER' ? 'text-white' : 'text-gray-500'}`}>
                Purchaser
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 items-center ${tab === 'CUSTOMER' ? 'bg-[#006269]' : 'bg-white'}`}
              onPress={() => setTab('CUSTOMER')}
            >
              <Text className={`text-sm font-semibold ${tab === 'CUSTOMER' ? 'text-white' : 'text-gray-500'}`}>
                Customer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-5">
          <View className="flex-row items-center mb-3">
            <User color="#006269" size={20} />
            <Text className="text-sm font-semibold text-[#006269] ml-2">Details</Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-700 mb-1">Name *</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-sm"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-700 mb-1">{companyLabel}</Text>
            <TextInput
              value={form.company_name}
              onChangeText={(v) => setForm({ ...form, company_name: v })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-sm"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-700 mb-1">Mobile Number *</Text>
            <TextInput
              keyboardType="phone-pad"
              value={form.mobile}
              onChangeText={(v) => setForm({ ...form, mobile: v })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-sm"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-700 mb-1">Address</Text>
            <TextInput
              value={form.address}
              onChangeText={(v) => setForm({ ...form, address: v })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-sm"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-700 mb-1">Opening Balance (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={form.opening_balance}
              onChangeText={(v) => setForm({ ...form, opening_balance: v })}
              editable={!editData}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-sm"
            />
          </View>

          {editData && (
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm text-gray-700">Active</Text>
              <Switch
                value={form.is_active}
                onValueChange={(v) => setForm({ ...form, is_active: v })}
                trackColor={{ true: '#006269' }}
              />
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <View className="absolute bottom-0 w-full bg-white border-t border-gray-200 p-4 flex-row justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-[30%] py-3 bg-white border border-gray-300 rounded-md items-center justify-center mr-2"
        >
          <Text className="text-gray-700 font-semibold text-sm">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={mutation.isPending}
          className="w-[68%] py-3 bg-[#006269] rounded-md flex-row items-center justify-center"
        >
          <Save color="white" size={16} />
          <Text className="text-white font-semibold text-sm ml-2">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
