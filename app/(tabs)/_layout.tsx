import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { Home, Database, ShoppingBag, CreditCard, GraduationCap } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export default function TabLayout() {
  const { user } = useAuth();
  const [shippedCount, setShippedCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchShippedOrders = async () => {
    if (!user) return;

    try {
      // Verifica se é admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('admin')
        .eq('id', user.id)
        .single();

      const adminUser = profileData?.admin === true;
      setIsAdmin(adminUser);

      // Query de pedidos shipped
      let ordersQuery = supabase
        .from('orders')
        .select('id')
        .eq('status', 'shipped');

      if (!adminUser) {
        ordersQuery = ordersQuery.eq('affiliate_id', user.id);
      }

      const { data: ordersData, error } = await ordersQuery;
      if (error) {
        console.log('Erro ao buscar pedidos shipped:', error);
        return;
      }

      setShippedCount(ordersData?.length || 0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShippedOrders(); // consulta inicial

    const interval = setInterval(() => {
      fetchShippedOrders();
    }, 10000); // atualiza a cada 10 segundos, ajuste conforme desejar

    return () => clearInterval(interval); // limpa o intervalo quando o componente desmonta
  }, [user]);

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
          tabBarIcon: ({ color, size }) => <Database size={size} color={color} />,
          headerTitle: 'Catálogo de Produtos',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          tabBarBadge: shippedCount > 0 ? shippedCount : undefined,
          headerTitle: 'Meus Pedidos',
        }}
      />
      <Tabs.Screen
        name="commissions"
        options={{
          title: 'Comissões',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
          headerTitle: 'Minhas Comissões',
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Treinamentos',
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
          headerTitle: 'Área de Treinamento',
        }}
      />
    </Tabs>
  );
}
