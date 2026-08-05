import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Receipt, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchExpenseCategories, createExpenseEntry, updateExpenseEntry, deleteExpenseEntry, fetchExpensesHistory, ExpenseCategory, ExpenseEntry } from '../api/expenses';

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [editExpense, setEditExpense] = useState<ExpenseEntry | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [note, setNote] = useState('');

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['activeExpenseCategories'],
    queryFn: () => fetchExpenseCategories(true)
  });

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['expensesHistory'],
    queryFn: () => fetchExpensesHistory(20)
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => createExpenseEntry(data.categoryId, data.name, data.cash, data.upi, data.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      closeModal();
      Alert.alert('Success', 'Expense recorded successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to record expense');
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (data: any) => updateExpenseEntry(data.id, data.categoryId, data.name, data.cash, data.upi, data.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      closeModal();
      Alert.alert('Success', 'Expense updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update expense');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deleteExpenseEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      closeModal();
      Alert.alert('Success', 'Expense deleted successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to delete expense');
    }
  });

  const handleDeleteExpense = () => {
    if (!editExpense) return;
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteExpenseMutation.mutate(editExpense.id) }
      ]
    );
  };

  const openExpenseModal = (category: ExpenseCategory, expense?: ExpenseEntry) => {
    setSelectedCategory(category);
    if (expense) {
      setEditExpense(expense);
      setCashAmount(expense.cash_amount.toString());
      setUpiAmount(expense.upi_amount.toString());
      setNote(expense.note || '');
    } else {
      setEditExpense(null);
      setCashAmount('');
      setUpiAmount('');
      setNote('');
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setEditExpense(null);
  };

  const handleSaveExpense = () => {
    if (!selectedCategory) return;
    
    const cash = parseFloat(cashAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    
    if (cash + upi <= 0) {
      Alert.alert('Invalid Amount', 'Total amount must be greater than zero');
      return;
    }

    if (editExpense) {
      updateExpenseMutation.mutate({
        id: editExpense.id,
        categoryId: selectedCategory.id,
        name: selectedCategory.name_en,
        cash,
        upi,
        note: note.trim() || undefined
      });
    } else {
      createExpenseMutation.mutate({
        categoryId: selectedCategory.id,
        name: selectedCategory.name_en,
        cash,
        upi,
        note: note.trim() || undefined
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <View className="flex-1 bg-canvas">
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} className="mr-3">
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-content-primary">Expenses</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ExpenseCategories' as never)}
          className="bg-gray-100 px-3 py-1.5 rounded-full"
        >
          <Text className="text-sm font-semibold text-content-secondary">Categories</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-sm font-bold text-content-secondary mb-3 uppercase tracking-wider">Record New Expense</Text>
        
        {isLoadingCategories ? (
          <ActivityIndicator size="small" color="#006269" className="mb-6" />
        ) : (
          <View className="mb-6">
            {categories?.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => openExpenseModal(cat)}
                className="bg-surface p-4 rounded-xl border border-border mb-3 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
                    <Receipt color="#006269" size={20} />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-content-primary">{cat.name_en}</Text>
                    <Text className="text-xs text-content-tertiary mt-0.5">Tap to record</Text>
                  </View>
                </View>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            ))}
            {categories?.length === 0 && (
              <View className="bg-surface p-6 rounded-xl border border-border items-center">
                <Text className="text-content-tertiary text-center">No active categories found.</Text>
                <Text className="text-content-tertiary text-center mt-1">Please ask admin to create categories.</Text>
              </View>
            )}
          </View>
        )}

        <Text className="text-sm font-bold text-content-secondary mb-3 uppercase tracking-wider">Recent History</Text>
        
        {isLoadingHistory ? (
          <ActivityIndicator size="small" color="#006269" />
        ) : (
          <View className="mb-8">
            {history?.map((entry) => {
              const cat = categories?.find(c => c.id === entry.category_id);
              return (
                <TouchableOpacity 
                  key={entry.id} 
                  onPress={() => {
                    if (cat) openExpenseModal(cat, entry);
                  }}
                  className="bg-surface p-4 rounded-xl border border-border mb-3 shadow-sm"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-base font-bold text-content-primary">{entry.expense_name}</Text>
                    <Text className="text-base font-bold text-red-600">₹{entry.total_amount.toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-xs text-content-tertiary">
                      Cash: ₹{entry.cash_amount.toLocaleString()} | UPI: ₹{entry.upi_amount.toLocaleString()}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400 mb-1">{formatDate(entry.spent_at)}</Text>
                  {entry.note ? (
                    <Text className="text-sm text-content-secondary mt-2 italic bg-canvas p-2 rounded">{entry.note}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {history?.length === 0 && (
              <View className="p-4 items-center">
                <Text className="text-content-tertiary">No recent expenses.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal for Recording Expense */}
      <Modal visible={!!selectedCategory} transparent={true} animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView 
          behavior="padding"
          className="flex-1 bg-black/50 p-4"
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
          <View className="bg-surface rounded-2xl p-6">
            <Text className="text-xl font-bold text-content-primary mb-2 text-center">
              {editExpense ? 'Edit' : 'Record'} {selectedCategory?.name_en}
            </Text>
            
            <View className="mb-4 mt-4">
              <Text className="text-sm font-semibold text-content-secondary mb-2">Cash Amount (₹)</Text>
              <TextInput placeholderTextColor="#849CA5" 
                className="bg-canvas border border-border rounded-lg px-4 py-3 text-base text-content-primary"
                placeholder="0"
                keyboardType="decimal-pad"
                value={cashAmount}
                onChangeText={setCashAmount}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-content-secondary mb-2">UPI Amount (₹)</Text>
              <TextInput placeholderTextColor="#849CA5" 
                className="bg-canvas border border-border rounded-lg px-4 py-3 text-base text-content-primary"
                placeholder="0"
                keyboardType="decimal-pad"
                value={upiAmount}
                onChangeText={setUpiAmount}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-content-secondary mb-2">Note (Optional)</Text>
              <TextInput placeholderTextColor="#849CA5" 
                className="bg-canvas border border-border rounded-lg px-4 py-3 text-base text-content-primary"
                placeholder="Add a remark..."
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200 flex-row justify-between items-center">
              <Text className="font-bold text-content-secondary uppercase text-xs">Total Expense</Text>
              <Text className="text-xl font-bold text-brand">
                ₹{((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)).toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-end gap-3">
              {editExpense ? (
                <TouchableOpacity 
                  onPress={handleDeleteExpense} 
                  disabled={deleteExpenseMutation.isPending || updateExpenseMutation.isPending}
                  className="w-[15%] py-3 bg-red-100 rounded-lg items-center justify-center mr-1"
                >
                  <Trash2 color="#dc2626" size={20} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={closeModal} className={`${editExpense ? 'w-[25%]' : 'flex-1'} py-3 bg-gray-100 rounded-lg items-center justify-center`}>
                <Text className="font-semibold text-content-secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveExpense} 
                className={`${editExpense ? 'w-[50%]' : 'flex-1'} py-3 bg-brand rounded-lg items-center justify-center`}
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending || deleteExpenseMutation.isPending}
              >
                {(createExpenseMutation.isPending || updateExpenseMutation.isPending) ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-semibold text-white">{editExpense ? 'Update' : 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// EOF
