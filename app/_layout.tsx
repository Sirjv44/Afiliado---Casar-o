import { Stack, useRouter } from 'expo-router';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { useEffect } from 'react';

function RootStack() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (router.pathname !== '/(tabs)') router.replace('/(tabs)');
      } else {
        if (router.pathname !== '/(auth)/login') router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, router]);
  

  // Renderiza loading se estiver carregando
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  // Não renderiza Stack vazio, o router.replace() vai direcionar
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}
