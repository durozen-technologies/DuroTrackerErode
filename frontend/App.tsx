import './global.css';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { AuthContext } from './src/contexts/AuthContext';

// ponytail: configure global React Query defaults once instead of per-query boilerplate.
// performance: 2 min staleTime avoids redundant refetches and network waterfalls on focus/mount.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 1,                 // fail fast on network disconnection
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setLoading(false);
      }
    };
    checkToken();

    const subscription = DeviceEventEmitter.addListener('auth:logout', () => {
      setToken(null);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#006269" />
      </View>
    );
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {token ? (
            <RootNavigator />
          ) : (
            <LoginScreen onLogin={(newToken) => setToken(newToken)} />
          )}
        </NavigationContainer>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
