import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider } from '@/context/AuthContext';
import { COLORS } from '@/constants/Colors';

const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
};

export default function Layout() {
  useFrameworkReady();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await storage.getItem('userToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Failed to get authentication token:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <AuthProvider>
      <>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.secondary,
            },
            headerTintColor: COLORS.text,
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        />
        <StatusBar style="light" />
      </>
    </AuthProvider>
  );
}
 