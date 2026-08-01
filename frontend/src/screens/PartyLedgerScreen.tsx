import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Pencil, IndianRupee } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchPartyLedger } from '../api/resources';
import type { LedgerEntry, Party } from '../types';

function formatMoney(n: number) {
  return `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function EntryRow({ entry }: { entry: LedgerEntry }) {
  if (entry.kind === 'bill') {
    const label = entry.bill_type === 'sale' ? 'Sale' : 'Purchase';
    const settled = Number(entry.balance_amount) <= 0;
    return (
      <View className="bg-surface border border-border rounded-xl p-4 mb-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-semibold text-content-primary">{label}</Text>
          <Text className="text-xs text-content-secondary">{entry.date}</Text>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-base font-bold text-content-primary">
            {formatMoney(entry.total_amount)}
          </Text>
          <View className={`px-2 py-0.5 rounded-full ${settled ? 'bg-status-successBg' : 'bg-status-warningBg'}`}>
            <Text className={`text-xs font-medium ${settled ? 'text-status-success' : 'text-status-warning'}`}>
              {settled ? 'Settled' : `Due ${formatMoney(entry.balance_amount)}`}
            </Text>
          </View>
        </View>
        {(Number(entry.cash_payment) > 0 || Number(entry.upi_payment) > 0) && (
          <Text className="text-xs text-content-tertiary mt-2">
            Paid at bill: Cash {formatMoney(entry.cash_payment)} · UPI {formatMoney(entry.upi_payment)}
          </Text>
        )}
      </View>
    );
  }

  const isReceived = entry.type === 'received';
  return (
    <View className="bg-brand-muted border border-brand rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-brand">
          {isReceived ? 'Payment Received' : 'Payment Made'}
        </Text>
        <Text className="text-xs text-content-secondary">{entry.date}</Text>
      </View>
      <Text className="text-base font-bold text-brand mt-1">{formatMoney(entry.total_amount)}</Text>
      <Text className="text-xs text-content-secondary mt-2">
        Cash {formatMoney(entry.cash_amount)} · UPI {formatMoney(entry.upi_amount)}
      </Text>
    </View>
  );
}

export default function PartyLedgerScreen({ navigation, route }: any) {
  const party: Party = route.params?.party;
  const partyId: string = party?.id || route.params?.partyId;

  const { data: ledger, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['partyLedger', partyId],
    queryFn: () => fetchPartyLedger(partyId),
    enabled: !!partyId,
  });

  const title = ledger?.name || party?.name || 'Party Ledger';
  const isSupplier = (ledger?.type || party?.type) === 'SUPPLIER';
  const paymentLabel = isSupplier ? 'Record Payment' : 'Record Collection';

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="px-4 py-3 bg-surface border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1" accessibilityLabel="Go back">
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-content-primary" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-xs text-content-secondary">
              {isSupplier ? 'Purchaser Ledger' : 'Customer Ledger'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('NewParty', {
              editData: {
                ...(party || {}),
                id: partyId,
                name: ledger?.name || party?.name,
                type: ledger?.type || party?.type,
                opening_balance: ledger?.opening_balance ?? party?.opening_balance,
                current_balance: ledger?.current_balance ?? party?.current_balance,
              },
            })
          }
          className="p-2 bg-gray-100 rounded-full"
          accessibilityLabel="Edit party"
        >
          <Pencil size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#006269" />
        </View>
      ) : isError ? (
        <Text className="text-center text-status-error mt-10 px-4">
          Error: {(error as any)?.message || 'Failed to load ledger'}
        </Text>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#006269']} />
            }
          >
            <View className="bg-surface border border-border rounded-xl p-4 mb-4">
              <Text className="text-xs text-content-secondary mb-1">Total Due</Text>
              <Text className="text-2xl font-bold text-brand mb-3">
                {formatMoney(ledger?.total_due ?? 0)}
              </Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-xs text-content-tertiary">Opening due</Text>
                  <Text className="text-sm font-semibold text-content-primary">
                    {formatMoney(ledger?.unpaid_opening_balance ?? 0)}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-content-tertiary">Bills due</Text>
                  <Text className="text-sm font-semibold text-content-primary">
                    {formatMoney(ledger?.bills_due ?? 0)}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-content-tertiary">Pending</Text>
                  <Text className="text-sm font-semibold text-content-primary">
                    {formatMoney(ledger?.current_balance ?? 0)}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-sm font-semibold text-content-primary mb-3">Timeline</Text>
            {(ledger?.entries || []).length === 0 ? (
              <Text className="text-center text-content-secondary py-8">
                No bills or payments yet.
              </Text>
            ) : (
              ledger!.entries.map((entry) => <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} />)
            )}
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-canvas border-t border-border">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('RecordPayment', {
                  partyId,
                  partyName: ledger?.name || party?.name,
                  partyType: ledger?.type || party?.type,
                  totalDue: ledger?.total_due ?? 0,
                })
              }
              disabled={(ledger?.total_due ?? 0) <= 0}
              className={`flex-row items-center justify-center py-3.5 rounded-xl ${
                (ledger?.total_due ?? 0) <= 0 ? 'bg-gray-300' : 'bg-brand'
              }`}
              accessibilityRole="button"
              accessibilityLabel={paymentLabel}
            >
              <IndianRupee size={18} color="white" />
              <Text className="text-white font-semibold text-base ml-2">{paymentLabel}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
