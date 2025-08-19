import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Button,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';
import StatusCard from '@/components/StatusCard';
import { BarChart } from 'lucide-react-native';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalAffiliates: 0,
    totalPaidCommissions: 0,
  });
  const [topAffiliates, setTopAffiliates] = useState([]);
  const [monthsAvailable, setMonthsAvailable] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'month' | 'period' | ''>('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [periodStart, setPeriodStart] = useState<string>(''); // YYYY-MM-DD
  const [periodEnd, setPeriodEnd] = useState<string>('');     // YYYY-MM-DD

  useEffect(() => {
    const fetchMonths = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('created_at');

      if (error) return console.error(error);

      const monthsSet = new Set<string>();
      data?.forEach((o) => {
        if (o.created_at) {
          const d = new Date(o.created_at);
          monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      });

      setMonthsAvailable(Array.from(monthsSet).sort((a, b) => (a > b ? -1 : 1)));
    };

    fetchMonths();
    fetchAdminStats(); // busca inicial sem filtro
  }, []);

  const fetchAdminStats = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      let query = supabase.from('orders').select('total_amount, affiliate_id, created_at');

      if (filterType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        query = query.gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString());
      } else if (filterType === 'period' && periodStart && periodEnd) {
        query = query.gte('created_at', new Date(periodStart).toISOString())
                     .lte('created_at', new Date(periodEnd).toISOString());
      }

      query = query.eq('status', 'delivered');
      const { data: orders, error: ordersError } = await query;
      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const affiliateSet = new Set(orders?.map((o) => o.affiliate_id));
      const totalAffiliates = affiliateSet.size;

      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('affiliate_id, amount, created_at')
        .eq('status', 'paid');
      if (commissionsError) throw commissionsError;

      let filteredCommissions = commissions;
      if (filterType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        filteredCommissions = commissions.filter(c => {
          const d = new Date(c.created_at);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      } else if (filterType === 'period' && periodStart && periodEnd) {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        filteredCommissions = commissions.filter(c => {
          const d = new Date(c.created_at);
          return d >= start && d <= end;
        });
      }

      const totalPaidCommissions = filteredCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

      const commissionsByAffiliate: Record<string, number> = {};
      filteredCommissions.forEach((c) => {
        if (!c.affiliate_id) return;
        if (!commissionsByAffiliate[c.affiliate_id]) commissionsByAffiliate[c.affiliate_id] = 0;
        commissionsByAffiliate[c.affiliate_id] += c.amount || 0;
      });

      const top = Object.entries(commissionsByAffiliate)
        .map(([id, value]) => ({ id, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const enriched = await Promise.all(
        top.map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', item.id)
            .single();
          return { name: profile?.full_name || 'Afiliado Desconhecido', value: item.value };
        })
      );

      setStats({ totalRevenue, totalOrders, totalAffiliates, totalPaidCommissions });
      setTopAffiliates(enriched);
    } catch (err) {
      console.error('Erro no dashboard admin:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando dashboard do admin...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Filtros</Text>

      {/* Filtro tipo */}
      <div style={{ marginBottom: 12 }}>
        <label style={styles.filterLabel}>Escolha o tipo de filtro:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'month' | 'period' | '')}
          style={styles.select}
        >
          <option value="">Selecione</option>
          <option value="month">Por Mês</option>
          <option value="period">Por Período</option>
        </select>
      </div>

      {/* Filtro mês */}
      {filterType === 'month' && (
        <div style={{ marginBottom: 12 }}>
          <label style={styles.filterLabel}>Selecione o Mês:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={styles.select}
          >
            <option value="">Todos</option>
            {monthsAvailable.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Filtro período */}
      {filterType === 'period' && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <label style={styles.filterLabel}>Data Início:</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              style={styles.dateInput}
            />
          </div>
          <div>
            <label style={styles.filterLabel}>Data Fim:</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              style={styles.dateInput}
            />
          </div>
        </div>
      )}

      <Button title="Aplicar Filtro" onPress={fetchAdminStats} color={COLORS.primary} />

      <Text style={styles.sectionTitle}>Resumo da Plataforma</Text>
      <StatusCard title="Faturamento Total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} subtitle="Somatório de vendas finalizadas" color={COLORS.primary} />
      <StatusCard title="Total de Pedidos" value={stats.totalOrders.toString()} subtitle="Pedidos no sistema" color={COLORS.cardAlt} />
      <StatusCard title="Afiliados Ativos" value={stats.totalAffiliates.toString()} subtitle="Afiliados com vendas" color={COLORS.success} />
      <StatusCard title="Comissões Pagas" value={`R$ ${stats.totalPaidCommissions.toFixed(2)}`} subtitle="Total pago em comissões" color={COLORS.warning} />

      <Text style={styles.sectionTitle}>Top 10 Afiliados</Text>
      {topAffiliates.map((a, index) => (
        <View key={index} style={styles.affiliateItem}>
          <BarChart size={16} color={COLORS.text} style={{ marginRight: 8 }} />
          <Text style={styles.affiliateText}>{index + 1}. {a.name} - R$ {a.value.toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 20, marginBottom: 12 },
  affiliateItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  affiliateText: { fontSize: 14, color: COLORS.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },

  // Estilo filtros
  filterLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 4, display: 'block' },
  select: { padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, color: COLORS.text, width: 200 },
  dateInput: { padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, color: COLORS.text },
});
