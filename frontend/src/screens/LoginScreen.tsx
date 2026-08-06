import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogIn } from 'lucide-react-native';
import client from '../api/client';

export default function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/auth/login', { username, password });
      
      const data = response.data;
      await AsyncStorage.setItem('access_token', data.access_token);
      onLogin(data.access_token);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Login Failed', 'Incorrect username or password');
      } else {
        Alert.alert('Error', 'Could not connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas justify-center items-center p-6">
      <View className="w-full max-w-sm bg-surface p-8 rounded-2xl border border-border shadow-sm">
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-brand rounded-2xl items-center justify-center mb-4">
             <Image 
                source={require('../../assets/icon.png')} 
                style={{width: 64, height: 64, borderRadius: 16}} 
                resizeMode="contain" 
             />
          </View>
          <Text className="text-2xl font-bold text-brand">Ledger Pro</Text>
          <Text className="text-sm text-content-secondary mt-1">Please sign in to continue</Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-content-secondary mb-1">Username</Text>
          <TextInput
            className="w-full bg-canvas border border-border rounded-lg px-4 py-3 text-content-primary"
            placeholder="Enter username"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-content-secondary mb-1">Password</Text>
          <TextInput
            className="w-full bg-canvas border border-border rounded-lg px-4 py-3 text-content-primary"
            placeholder="Enter password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="w-full bg-brand rounded-lg flex-row justify-center items-center py-3.5 shadow-sm"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <LogIn color="white" size={20} className="mr-2" />
              <Text className="text-white font-bold text-base">Sign In</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
