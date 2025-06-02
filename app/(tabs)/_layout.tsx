import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import {
  Home,
  Database,
  ShoppingBag,
  CreditCard,
  GraduationCap,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  console.log('Usuário no TabLayout:', user); // Log para depuração

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.secondary,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.secondary,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Abas disponíveis para todos os usuários */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerTitle: 'Painel do Afiliado',
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Database size={size} color={color} />
          ),
          headerTitle: 'Catálogo de Produtos',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} color={color} />
          ),
          headerTitle: 'Meus Pedidos',
        }}
      />
      <Tabs.Screen
        name="commissions"
        options={{
          title: 'Comissões',
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
          headerTitle: 'Minhas Comissões',
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Treinamentos',
          tabBarIcon: ({ color, size }) => (
            <GraduationCap size={size} color={color} />
          ),
          headerTitle: 'Área de Treinamento',
        }}
      />

      {/* NÃO adicionar affiliates e AlterarProdutos aqui. Devem estar em /admin e acessadas via push */}
    </Tabs>
  );
}
