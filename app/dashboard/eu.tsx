import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import StatusCard from '@/components/StatusCard';
import ActionButton from '@/components/ActionButton';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    goal: 1000,
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .eq('affiliate_id', user?.id)
          .gte('created_at', startOfMonth.toISOString())
          .eq('status', 'delivered');

        const totalSales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount, status, created_at, product_name, percentage')
          .eq('affiliate_id', user?.id);

        let totalCommission = 0;
        let paidCommission = 0;
        let pendingCommission = 0;

        commissions?.forEach((c) => {
          totalCommission += c.amount || 0;
          if (c.status === 'paga') paidCommission += c.amount || 0;
          if (c.status === 'pendente') pendingCommission += c.amount || 0;
        });

        setStats({
          totalSales,
          totalOrders,
          totalCommission,
          paidCommission,
          pendingCommission,
          goal: 1000, // Meta mensal fixa (pode vir do backend futuramente)
        });

        setHistory(commissions || []);
      } catch (err) {
        console.error('Erro no dashboard individual:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando desempenho...</Text>
      </View>
    );
  }

  const progress = Math.min(stats.totalCommission / stats.goal, 1);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.highlightText}>
        Você já faturou R$ {stats.totalCommission.toFixed(2)} este mês. Continue vendendo e aumentando sua renda!
      </Text>

      <View style={styles.statsContainer}>
        <StatusCard
          title="Total de Vendas"
          value={`R$ ${stats.totalSales.toFixed(2)}`}
          subtitle={`${stats.totalOrders} pedidos finalizados`}
          color={COLORS.cardAlt}
        />
        <StatusCard
          title="Comissão Paga"
          value={`R$ ${stats.paidCommission.toFixed(2)}`}
          subtitle="Valor já recebido"
          color={COLORS.success}
        />
        <StatusCard
          title="Comissão Pendente"
          value={`R$ ${stats.pendingCommission.toFixed(2)}`}
          subtitle="Aguardando pagamento"
          color={COLORS.warning}
        />
      </View>

      <Text style={styles.sectionTitle}>Meta de Comissão Mensal</Text>
      <ProgressBar progress={progress} label={`R$ ${stats.totalCommission.toFixed(2)} / R$ ${stats.goal}`} />

      <Text style={styles.sectionTitle}>Histórico de Comissões</Text>
      {history.map((item, index) => (
        <View key={index} style={styles.historyItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
            <Text style={styles.valueText}>Comissão: R$ {item.amount.toFixed(2)} ({item.percentage}%)</Text>
          </View>
          <Badge status={item.status} />
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    color: COLORS.text,
  },
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
