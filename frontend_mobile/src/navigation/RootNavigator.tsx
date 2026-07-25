import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutGrid, ShoppingCart, Tag, Users, Receipt } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import PartiesScreen from '../screens/PartiesScreen';
import PurchasesScreen from '../screens/PurchasesScreen';
import SalesScreen from '../screens/SalesScreen';
import NewPurchaseScreen from '../screens/NewPurchaseScreen';
import NewSaleScreen from '../screens/NewSaleScreen';
import NewPartyScreen from '../screens/NewPartyScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ExpenseCategoriesScreen from '../screens/ExpenseCategoriesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PartyLedgerScreen from '../screens/PartyLedgerScreen';
import RecordPaymentScreen from '../screens/RecordPaymentScreen';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from 'react-native';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Tab.Navigator
        tabBarPosition="bottom"
        screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#006269',
        tabBarInactiveTintColor: '#4B636B',
        tabBarIndicatorStyle: { 
          backgroundColor: '#006269', 
          height: 3, 
          top: 0,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        },
        tabBarLabel: ({ focused, color }) => {
          let activeColor = '#006269'; // Default teal
          if (focused) {
            if (route.name === 'Purchases') activeColor = '#4F46E5';
            else if (route.name === 'Sales') activeColor = '#006269';
            else if (route.name === 'Parties') activeColor = '#D97706';
            else if (route.name === 'Expenses') activeColor = '#E11D48';
          }
          const displayColor = focused ? activeColor : color;
          
          return (
            <Text 
              numberOfLines={1} 
              adjustsFontSizeToFit
              style={{ 
                color: displayColor, 
                fontSize: 10, 
                fontWeight: '600', 
                marginTop: 4, 
                textAlign: 'center',
                width: '100%' 
              }}
            >
              {route.name}
            </Text>
          );
        },
        tabBarItemStyle: {
          paddingTop: 10,
          paddingBottom: 6,
          paddingHorizontal: 0,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarStyle: { 
          paddingBottom: insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowIcon: true,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => <LayoutGrid color={focused ? '#006269' : color} size={20} />,
        }}
      />
      <Tab.Screen 
        name="Purchases" 
        component={PurchasesScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => <ShoppingCart color={focused ? '#4F46E5' : color} size={20} />,
        }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SalesScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => <Tag color={focused ? '#006269' : color} size={20} />,
        }}
      />
      <Tab.Screen 
        name="Parties" 
        component={PartiesScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => <Users color={focused ? '#D97706' : color} size={20} />,
        }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => <Receipt color={focused ? '#E11D48' : color} size={20} />,
        }}
      />
    </Tab.Navigator>
    </SafeAreaView>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="NewParty" component={NewPartyScreen} />
      <Stack.Screen name="NewPurchase" component={NewPurchaseScreen} />
      <Stack.Screen name="NewSale" component={NewSaleScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="ExpenseCategories" component={ExpenseCategoriesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Items" component={ItemsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PartyLedger" component={PartyLedgerScreen} />
      <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
    </Stack.Navigator>
  );
}
