import React, { useState, useEffect, useCallback } from 'react';
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
import { createClient } from '@/lib/supabase';

const supabase = createClient();

const statusFilters = ['shipped', 'delivered'];

const statusLabels = {
  shipped: 'Enviado',
  delivered: 'Entregue',
} as const;

const statusColors = {
  shipped: COLORS.info,
  delivered: COLORS.success,
} as const;

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'shipped' | 'delivered'>('shipped');

  const loadOrders = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const userId = sessionData.session.user.id;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('admin')
        .eq('id', userId)
        .single();

      const isAdminUser = profileData?.admin === true;
      setIsAdmin(isAdminUser);

      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          client_name,
          created_at,
          total_amount,
          status,
          affiliate_id,
          profiles (full_name)
        `)
        .eq('status', activeFilter)
        .order('created_at', { ascending: false });

      if (!isAdminUser) {
        ordersQuery = ordersQuery.eq('affiliate_id', userId);
      }

      const { data: ordersData } = await ordersQuery;
      if (!ordersData) return;

      const orderIds = ordersData.map((o) => o.id);
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('order_id, quantity')
        .in('order_id', orderIds);

      const itemCounts = {};
      orderItemsData?.forEach((item) => {
        const orderId = item.order_id;
        itemCounts[orderId] = (itemCounts[orderId] ?? 0) + (item.quantity ?? 0);
      });

      const transformed = ordersData.map((order) => {
        let formattedDate = '';
        if (order.created_at) {
          const date = new Date(order.created_at);
          formattedDate = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
        }
      
        return {
          id: order.id,
          clientName: order.client_name ?? 'Cliente não informado',
          date: formattedDate, // 👈 agora tem data e hora
          totalAmount: typeof order.total_amount === 'number' ? order.total_amount : 0,
          status: order.status,
          items: itemCounts[order.id] ?? 0,
          affiliateName: order.profiles?.full_name ?? '',
        };
      });

      setOrders(transformed);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [activeFilter])
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {statusFilters.map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            activeFilter === status && styles.activeFilter,
          ]}
          onPress={() => setActiveFilter(status)}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === status && styles.activeFilterText,
            ]}
          >
            {statusLabels[status]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push({ pathname: '/order/[order_id]', params: { order_id: item.id } })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIcon}>
          <ShoppingBag size={20} color={COLORS.text} />
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.orderId}>Pedido #{item.id}</Text>
          {isAdmin && item.affiliateName ? (
            <Text style={styles.affiliateName}>Afiliado: {item.affiliateName}</Text>
          ) : null}
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
          <Text style={styles.detailValue}>R$ {item.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Itens</Text>
          <Text style={styles.detailValue}>{item.items}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}
        >
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderFilterButtons()}
  
      {/* 👇 Resumo de quantas vendas tem no filtro atual */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {orders.length}{' '}
          {orders.length === 1 ? 'venda enviada' : `vendas ${statusLabels[activeFilter].toLowerCase()}s`}
        </Text>
      </View>

  
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
  
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => router.push('/order/new')}
      >
        <Plus size={24} color="#FFF" />
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
    paddingBottom: 80,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },  
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  activeFilter: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  activeFilterText: {
    color: COLORS.text,
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
  affiliateName: {
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