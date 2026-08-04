import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordPayment } from '../api/resources';
import type { PartyType } from '../types';

function formatMoney(n: number) {
  return `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function toYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function RecordPaymentScreen({ navigation, route }: any) {
  const queryClient = useQueryClient();
  const partyId: string = route.params?.partyId;
  const partyName: string = route.params?.partyName || 'Party';
  const partyType: PartyType = route.params?.partyType || 'CUSTOMER';
  const totalDue: number = Number(route.params?.totalDue) || 0;

  const isSupplier = partyType === 'SUPPLIER';
  const title = isSupplier ? 'Record Payment' : 'Record Collection';
  const cashLabel = isSupplier ? 'Cash Paid' : 'Cash Received';
  const upiLabel = isSupplier ? 'UPI Paid' : 'UPI Received';

  const [date, setDate] = useState(toYMD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');

  const cashNum = parseFloat(cash) || 0;
  const upiNum = parseFloat(upi) || 0;
  const total = useMemo(() => cashNum + upiNum, [cashNum, upiNum]);
  const remaining = totalDue - total;
  const overpay = total > totalDue + 0.001;

  const mutation = useMutation({
    mutationFn: () =>
      recordPayment({
        party_id: partyId,
        date,
        cash_amount: cashNum,
        upi_amount: upiNum,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['partyLedger', partyId] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      const bills = result.bill_allocations?.length || 0;
      Alert.alert(
        'Payment recorded',
        `Settled opening ₹${Number(result.opening_settled).toLocaleString('en-IN')} and ${bills} bill(s).`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      let msg = 'Failed to record payment';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((e: any) => e.msg).join(', ');
      Alert.alert('Error', msg);
    },
  });

  const handleSave = () => {
    if (total <= 0) {
      Alert.alert('Error', 'Enter a Cash or UPI amount greater than zero');
      return;
    }
    if (overpay) {
      Alert.alert(
        'Overpayment',
        `Payment ${formatMoney(total)} exceeds total due ${formatMoney(totalDue)}. Reduce Cash/UPI.`,
      );
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="px-4 py-3 bg-surface border-b border-border flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4" accessibilityLabel="Go back">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-content-primary">{title}</Text>
          <Text className="text-xs text-content-secondary" numberOfLines={1}>
            {partyName}
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-xs text-content-secondary mb-1">Total Due</Text>
          <Text className="text-2xl font-bold text-brand">{formatMoney(totalDue)}</Text>
        </View>

        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-brand mb-3">Payment</Text>

          <Text className="text-xs text-content-secondary mb-1">Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="border border-border rounded-md px-3 py-2.5 mb-3 bg-canvas"
          >
            <Text className="text-content-primary">{date}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={(_e, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) setDate(toYMD(selected));
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}

          <Text className="text-xs text-content-secondary mb-1">{cashLabel}</Text>
          <TextInput placeholderTextColor="#849CA5"
            keyboardType="decimal-pad"
            value={cash}
            onChangeText={setCash}
            placeholder="0"
            className="border border-border rounded-md px-3 py-2.5 mb-3 bg-canvas text-content-primary"
            accessibilityLabel={cashLabel}
          />

          <Text className="text-xs text-content-secondary mb-1">{upiLabel}</Text>
          <TextInput placeholderTextColor="#849CA5"
            keyboardType="decimal-pad"
            value={upi}
            onChangeText={setUpi}
            placeholder="0"
            className="border border-border rounded-md px-3 py-2.5 mb-3 bg-canvas text-content-primary"
            accessibilityLabel={upiLabel}
          />

          <View className="flex-row justify-between mt-1 pt-3 border-t border-border">
            <Text className="text-sm text-content-secondary">Total paying</Text>
            <Text className={`text-sm font-bold ${overpay ? 'text-status-error' : 'text-content-primary'}`}>
              {formatMoney(total)}
            </Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-sm text-content-secondary">Remaining after</Text>
            <Text className={`text-sm font-bold ${overpay ? 'text-status-error' : 'text-brand'}`}>
              {overpay ? 'Overpayment' : formatMoney(Math.max(0, remaining))}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={mutation.isPending || total <= 0 || overpay}
          className={`py-3.5 rounded-xl items-center ${
            mutation.isPending || total <= 0 || overpay ? 'bg-gray-300' : 'bg-brand'
          }`}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          <Text className="text-white font-semibold text-base">
            {mutation.isPending ? 'Saving…' : title}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
