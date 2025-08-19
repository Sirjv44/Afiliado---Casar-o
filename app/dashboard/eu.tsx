import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import StatusCard from '@/components/StatusCard';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'month' | 'period' | ''>('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthsAvailable, setMonthsAvailable] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState(''); // YYYY-MM-DD
  const [periodEnd, setPeriodEnd] = useState('');     // YYYY-MM-DD
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    goal: 1000,
  });
  const [history, setHistory] = useState([]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Buscar meses disponíveis
  useEffect(() => {
    const fetchMonths = async () => {
      if (!user?.id) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('created_at')
        .eq('affiliate_id', user.id)
        .eq('status', 'delivered');
      if (error) return console.error(error);

      const monthsSet = new Set<string>();
      data?.forEach((o) => {
        if (o.created_at) {
          const d = new Date(o.created_at);
          monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      });
      const monthsArr = Array.from(monthsSet).sort((a, b) => (a > b ? -1 : 1));
      setMonthsAvailable(monthsArr);
      setSelectedMonth(monthsArr[0] || '');
    };
    fetchMonths();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const supabase = createClient();
      let startDate: Date;
      let endDate: Date;

      if (filterType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      } else if (filterType === 'period' && periodStart && periodEnd) {
        startDate = new Date(periodStart);
        endDate = new Date(periodEnd + 'T23:59:59');
      } else {
        startDate = new Date(0);
        endDate = new Date();
      }

      // Pedidos
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('affiliate_id', user.id)
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalSales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      // Comissões
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, created_at, product_name, percentage')
        .eq('affiliate_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

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
      console.error('Erro no dashboard affiliate:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Filtros</Text>

      {/* Tipo de filtro */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.filterLabel}>Escolha o tipo de filtro:</Text>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'month' | 'period' | '')}
          style={styles.select}
        >
          <option value="">Selecione</option>
          <option value="month">Por Mês</option>
          <option value="period">Por Período</option>
        </select>
      </View>

      {/* Filtro mês */}
      {filterType === 'month' && (
        <View style={{ marginBottom: 16 }}>  {/* <--- adiciona espaço abaixo */}
          <Text style={styles.filterLabel}>Selecione o Mês:</Text>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={styles.select}
          >
            <option value="">Todos</option>
            {monthsAvailable.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </View>
      )}

      {/* Filtro período */}
      {filterType === 'period' && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}> {/* <--- espaço */}
          <View>
            <Text style={styles.filterLabel}>Data Início:</Text>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              style={styles.dateInput}
            />
          </View>
          <View>
            <Text style={styles.filterLabel}>Data Fim:</Text>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              style={styles.dateInput}
            />
          </View>
        </View>
      )}


      <TouchableOpacity style={styles.applyButton} onPress={fetchData}>
        <Text style={styles.applyButtonText}>Aplicar Filtro</Text>
      </TouchableOpacity>

      <Text style={styles.highlightText}>
        {filterType === 'month'
          ? `R$ ${stats.totalCommission.toFixed(2)} em ${selectedMonth}`
          : filterType === 'period'
          ? `R$ ${stats.totalCommission.toFixed(2)} de ${periodStart} até ${periodEnd}`
          : `R$ ${stats.totalCommission.toFixed(2)} este ano`}
      </Text>

      {/* Cards de estatísticas */}
      <View style={styles.statsContainer}>
        <StatusCard title="Total de Vendas" value={`R$ ${stats.totalSales.toFixed(2)}`} subtitle={`${stats.totalOrders} pedidos`} color={COLORS.cardAlt} />
        <StatusCard title="Comissão Paga" value={`R$ ${stats.paidCommission.toFixed(2)}`} subtitle="Já recebido" color={COLORS.success} />
        <StatusCard title="Comissão Pendente" value={`R$ ${stats.pendingCommission.toFixed(2)}`} subtitle="Aguardando pagamento" color={COLORS.warning} />
      </View>

      {/* Meta mensal */}
      <Text style={styles.sectionTitle}>Meta Mensal</Text>
      <ProgressBar
        progress={Math.min(stats.totalCommission / stats.goal, 1)}
        label={`R$ ${stats.totalCommission.toFixed(2)} / R$ ${stats.goal}`}
      />

      {/* Histórico */}
      <Text style={styles.sectionTitle}>Histórico</Text>
      {history.map((item, index) => (
        <View key={index} style={styles.historyItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            <Text style={styles.valueText}>Comissão: R$ {item.amount.toFixed(2)} ({item.percentage}%)</Text>
          </View>
          <Badge status={item.status} />
        </View>
      ))}

      {!loading && history.length === 0 && (
        <Text style={styles.empty}>Nenhuma venda registrada neste período.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 20, marginBottom: 12 },
  statsContainer: { marginBottom: 20 },
  historyItem: { backgroundColor: COLORS.card, padding: 12, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  dateText: { fontSize: 12, color: COLORS.textSecondary },
  valueText: { fontSize: 14, color: COLORS.text },
  highlightText: { fontSize: 16, fontWeight: '600', marginBottom: 20, color: COLORS.text },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },

  // Filtros
  filterLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 4 },
  select: { padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, color: COLORS.text, width: 200 },
  dateInput: { padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, color: COLORS.text },
  applyButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  applyButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
