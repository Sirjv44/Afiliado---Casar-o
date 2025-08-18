import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import StatusCard from '@/components/StatusCard';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // mês atual
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    goal: 1000,
  });
  const [history, setHistory] = useState([]);

  // Buscar meses disponíveis
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const supabase = createClient();

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        const { data: orders } = await supabase
          .from('orders')
          .select('created_at')
          .eq('affiliate_id', user?.id)
          .eq('status', 'delivered')
          .gte('created_at', startOfYear.toISOString());

        if (!orders) return;

        const months = Array.from(new Set(
          orders.map((o: any) => new Date(o.created_at).getMonth())
        )).sort((a, b) => a - b);

        setAvailableMonths(months);

        if (!months.includes(selectedMonth)) {
          setSelectedMonth(months[0] || new Date().getMonth());
        }
      } catch (err) {
        console.error('Erro ao buscar meses:', err);
      }
    };

    fetchAvailableMonths();
  }, [user?.id]);

  // Buscar dados do mês selecionado
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const supabase = createClient();

        const startOfMonth = new Date(new Date().getFullYear(), selectedMonth, 1);
        const endOfMonth = new Date(new Date().getFullYear(), selectedMonth + 1, 0);

        // pedidos
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .eq('affiliate_id', user?.id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .eq('status', 'delivered');

        const totalSales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        // comissões
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount, status, created_at, product_name, percentage')
          .eq('affiliate_id', user?.id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

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
          goal: 1000,
        });

        setHistory(commissions || []);
      } catch (err) {
        console.error('Erro no dashboard individual:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, user?.id]);

  const progress = Math.min(stats.totalCommission / stats.goal, 1);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Selecione o mês</Text>
      <Picker
        selectedValue={selectedMonth}
        onValueChange={(value) => setSelectedMonth(value)}
        style={[styles.picker, { color: 'white' }]}
        dropdownIconColor="white"
      >
        {availableMonths.map((i) => (
          <Picker.Item
            key={i}
            label={new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
            value={i}
            color="white"
          />
        ))}
      </Picker>

      <Text style={styles.highlightText}>
        R$ {stats.totalCommission.toFixed(2)} em{' '}
        {new Date(0, selectedMonth).toLocaleString('pt-BR', { month: 'long' })}.
      </Text>

      <View style={styles.statsContainer}>
        <StatusCard
          title="Total de Vendas"
          value={`R$ ${stats.totalSales.toFixed(2)}`}
          subtitle={`${stats.totalOrders} pedidos`}
          color={COLORS.cardAlt}
        />
        <StatusCard
          title="Comissão Paga"
          value={`R$ ${stats.paidCommission.toFixed(2)}`}
          subtitle="Já recebido"
          color={COLORS.success}
        />
        <StatusCard
          title="Comissão Pendente"
          value={`R$ ${stats.pendingCommission.toFixed(2)}`}
          subtitle="Aguardando pagamento"
          color={COLORS.warning}
        />
      </View>

      <Text style={styles.sectionTitle}>Meta Mensal</Text>
      <ProgressBar
        progress={progress}
        label={`R$ ${stats.totalCommission.toFixed(2)} / R$ ${stats.goal}`}
      />

      <Text style={styles.sectionTitle}>Histórico</Text>
      {history.map((item, index) => (
        <View key={index} style={styles.historyItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.valueText}>
              Comissão: R$ {item.amount.toFixed(2)} ({item.percentage}%)
            </Text>
          </View>
          <Badge status={item.status} />
        </View>
      ))}

      {!loading && history.length === 0 && (
        <Text style={styles.empty}>Nenhuma venda registrada neste mês.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  picker: {
    backgroundColor: COLORS.card,
    marginBottom: 20,
  },  
  highlightText: { fontSize: 16, fontWeight: '600', marginBottom: 20, color: COLORS.text },
  statsContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  historyItem: { backgroundColor: COLORS.card, padding: 12, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  dateText: { fontSize: 12, color: COLORS.textSecondary },
  valueText: { fontSize: 14, color: COLORS.text },
});
