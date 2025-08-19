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
import { useAuth } from '@/context/AuthContext';

export default function GamificacaoScreen() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [recordePessoal, setRecordePessoal] = useState(0);
  const [maiorVenda, setMaiorVenda] = useState(1);
  const [filterType, setFilterType] = useState<'month' | 'period' | ''>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Carregar meses disponíveis
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const supabase = createClient();
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        const { data: orders } = await supabase
          .from('orders')
          .select('created_at')
          .eq('status', 'delivered')
          .gte('created_at', startOfYear.toISOString());

        if (!orders) return;

        const months = Array.from(new Set(
          orders.map((o: any) => new Date(o.created_at).getMonth())
        ));

        setAvailableMonths(months);

        if (!months.includes(selectedMonth)) setSelectedMonth(months[0] || new Date().getMonth());
      } catch (err) {
        console.error(err);
      }
    };

    fetchAvailableMonths();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  

  const applyFilter = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let startDate: Date;
      let endDate: Date;

      if (filterType === 'month') {
        startDate = new Date(new Date().getFullYear(), selectedMonth, 1);
        endDate = new Date(new Date().getFullYear(), selectedMonth + 1, 0);
      } else if (filterType === 'period' && periodStart && periodEnd) {
        startDate = new Date(periodStart);
        endDate = new Date(periodEnd);
      } else {
        startDate = new Date(new Date().getFullYear(), 0, 1);
        endDate = new Date();
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('affiliate_id, total_amount, created_at')
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!orders || orders.length === 0) {
        setRanking([]);
        setRecordePessoal(0);
        setMaiorVenda(1);
        return;
      }

      const salesByAffiliate: Record<string, number> = {};
      orders.forEach((o) => {
        if (!salesByAffiliate[o.affiliate_id]) salesByAffiliate[o.affiliate_id] = 0;
        salesByAffiliate[o.affiliate_id] += o.total_amount || 0;
      });

      const topAffiliates = Object.entries(salesByAffiliate)
        .map(([id, total]) => ({ id, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const enriched = await Promise.all(
        topAffiliates.map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', item.id)
            .single();
          return {
            name: profile?.full_name || 'Afiliado',
            total: item.total,
            isCurrentUser: item.id === user?.id,
          };
        })
      );

      setRanking(enriched);
      const currentUser = enriched.find((r) => r.isCurrentUser);
      setRecordePessoal(currentUser?.total || 0);

      const maior = Math.max(...enriched.map((r) => r.total), 1);
      setMaiorVenda(maior);
    } catch (err) {
      console.error('Erro no ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ranking de Afiliados</Text>

      {/* Filtros */}
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.filterLabel}>Tipo de Filtro:</Text>
        <Picker
          selectedValue={filterType}
          onValueChange={(val) => setFilterType(val)}
          style={styles.picker}
          dropdownIconColor={COLORS.text}
        >
          <Picker.Item label="Selecione" value="" />
          <Picker.Item label="Por Mês" value="month" />
          <Picker.Item label="Por Período" value="period" />
        </Picker>

        {filterType === 'month' && (
          <>
            <Text style={styles.filterLabel}>Selecione o Mês:</Text>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(val) => setSelectedMonth(val)}
              style={styles.picker}
              dropdownIconColor={COLORS.text}
            >
              {availableMonths.map((i) => (
                <Picker.Item
                  key={i}
                  label={new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                  value={i}
                />
              ))}
            </Picker>
          </>
        )}

        {filterType === 'period' && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Data Início:</Text>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                style={styles.dateInput}
              />
            </View>
            <View style={{ flex: 1 }}>
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

        <View style={{ marginTop: 16 }}>
          <Button title="Aplicar Filtro" onPress={applyFilter} color={COLORS.primary} />
        </View>
      </View>

      <Text style={styles.subTitle}>
        {filterType === 'month'
          ? `${new Date(0, selectedMonth).toLocaleString('pt-BR', { month: 'long' })} ${new Date().getFullYear()}`
          : filterType === 'period'
          ? `De ${formatDate(periodStart)} até ${formatDate(periodEnd)}`
          : 'Este Ano'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        ranking.map((item, index) => (
          <View
            key={index}
            style={[styles.card, item.isCurrentUser && styles.highlightCard]}
          >
            <Text style={styles.position}>{index + 1}º</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((item.total / maiorVenda) * 100, 100)}%`,
                      backgroundColor: item.isCurrentUser ? COLORS.primary : COLORS.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.total}>R$ {item.total.toFixed(2)}</Text>
              {item.isCurrentUser && <Text style={styles.badge}>🎉 Seu melhor mês!</Text>}
            </View>
          </View>
        ))
      )}

      {!loading && ranking.length === 0 && (
        <Text style={styles.empty}>Nenhuma venda registrada neste período.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: COLORS.background },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  subTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 16 },
  picker: { backgroundColor: COLORS.card, marginBottom: 12, borderRadius: 8, color: COLORS.text },
  filterLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 4 },
  dateInput: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, color: COLORS.text, width: '100%' },

  card: { backgroundColor: COLORS.cardAlt, borderRadius: 10, padding: 12, marginBottom: 12 },
  highlightCard: { borderColor: COLORS.primary, borderWidth: 2 },
  position: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  infoContainer: { marginTop: 6 },
  name: { fontSize: 16, color: COLORS.text },
  progressBarContainer: { height: 8, backgroundColor: COLORS.card, borderRadius: 4, marginTop: 8, marginBottom: 4, overflow: 'hidden' },
  progressBar: { height: 8, borderRadius: 4 },
  total: { fontSize: 14, color: COLORS.textSecondary },
  badge: { fontSize: 12, color: COLORS.success, fontWeight: 'bold', marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
});
