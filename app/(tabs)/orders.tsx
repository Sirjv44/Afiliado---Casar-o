import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { ShoppingBag, ChevronRight, Plus } from 'lucide-react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@/lib/supabase'; // <- ajuste aqui

const supabase = createClient(); // <- crie o cliente aqui

interface Order {
  id: string;
  clientName: string;
  date: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  items: number;
}

const statusLabels = {
  pending: 'Pendente',
  processing: 'Em processamento',
  shipped: 'Enviado',
  delivered: 'Entregue',
  canceled: 'Cancelado',
};

const statusColors = {
  pending: COLORS.warning,
  processing: COLORS.info,
  shipped: COLORS.info,
  delivered: COLORS.success,
  canceled: COLORS.error,
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    try {
      // 1. Obter usuário logado
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('Usuário não autenticado:', sessionError?.message);
        return;
      }

      const userId = sessionData.session.user.id;

      // 2. Buscar pedidos apenas do usuário logado
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, client_name, created_at, total_amount, status')
        .eq('affiliate_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao buscar pedidos:', ordersError.message);
        return;
      }

      if (!ordersData) return;

      // 3. Buscar os itens de todos os pedidos
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity');

      if (itemsError) {
        console.error('Erro ao buscar itens dos pedidos:', itemsError.message);
        return;
      }

      // 4. Mapear order_id => total de itens
      const itemCounts: Record<string, number> = {};
      orderItemsData?.forEach((item) => {
        const orderId = item.order_id;
        itemCounts[orderId] = (itemCounts[orderId] ?? 0) + (item.quantity ?? 0);
      });

      // 5. Montar dados para a tela
      const transformed: Order[] = ordersData.map((order: any) => ({
        id: order.id,
        clientName: order.client_name ?? 'Cliente não informado',
        date: order.created_at
          ? new Date(order.created_at).toLocaleDateString('pt-BR')
          : '',
        totalAmount:
          typeof order.total_amount === 'number' ? order.total_amount : 0,
        status: order.status ?? 'pending',
        items: itemCounts[order.id] ?? 0,
      }));

      setOrders(transformed);
    } catch (error) {
      console.error('Erro inesperado ao carregar pedidos:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() =>
        router.push({
          pathname: '/order/[order_id]',
          params: { order_id: item.id },
        })
      }
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIcon}>
          <ShoppingBag size={20} color={COLORS.text} />
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.orderId}>Pedido #{item.id}</Text>
        </View>
        <ChevronRight size={20} color={COLORS.textSecondary} />
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Data</Text>
          <Text style={styles.detailValue}>{item.date}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.detailValue}>
            R$ {item.totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Itens</Text>
          <Text style={styles.detailValue}>{item.items}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const NoOrders = () => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={60} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
      <Text style={styles.emptyText}>
        Você ainda não realizou nenhum pedido. Comece a vender agora!
      </Text>
      <TouchableOpacity
        style={styles.newOrderButton}
        onPress={() => router.push('/order/new')}
      >
        <Text style={styles.newOrderButtonText}>Criar Novo Pedido</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={NoOrders}
      />

      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => router.push('/order/new')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  newOrderButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  newOrderButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderId: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
