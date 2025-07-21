import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';
import StatusCard from '@/components/StatusCard';
import { BarChart } from 'lucide-react-native'; // Ícone de barra

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalAffiliates: 0,
    totalPaidCommissions: 0,
  });
  const [topAffiliates, setTopAffiliates] = useState([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      const supabase = createClient();
      try {
        // Vendas finalizadas
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, affiliate_id')
          .eq('status', 'delivered');

        if (ordersError) throw ordersError;

        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        const affiliateSet = new Set(orders?.map((o) => o.affiliate_id));
        const totalAffiliates = affiliateSet.size;

        // Comissões pagas
        const { data: commissions, error: commissionsError } = await supabase
          .from('commissions')
          .select('amount')
          .eq('status', 'paid');

        if (commissionsError) throw commissionsError;

        const totalPaidCommissions = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

        // Top 10 afiliados por volume de vendas
        const affiliateMap: Record<string, number> = {};
        orders?.forEach((o) => {
          if (!o.affiliate_id) return;
          if (!affiliateMap[o.affiliate_id]) affiliateMap[o.affiliate_id] = 0;
          affiliateMap[o.affiliate_id] += o.total_amount || 0;
        });

        const top = Object.entries(affiliateMap)
          .map(([id, value]) => ({ id, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        const enriched = await Promise.all(
          top.map(async (item) => {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', item.id)
              .single();
            return {
              name: profile?.full_name || 'Afiliado Desconhecido',
              value: item.value,
            };
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

    fetchAdminStats();
  }, []);

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
      <Text style={styles.sectionTitle}>Resumo da Plataforma</Text>

      <StatusCard
        title="Faturamento Total"
        value={`R$ ${stats.totalRevenue.toFixed(2)}`}
        subtitle="Somatório de vendas finalizadas"
        color={COLORS.primary}
      />
      <StatusCard
        title="Total de Pedidos"
        value={stats.totalOrders.toString()}
        subtitle="Pedidos no sistema"
        color={COLORS.cardAlt}
      />
      <StatusCard
        title="Afiliados Ativos"
        value={stats.totalAffiliates.toString()}
        subtitle="Afiliados com vendas"
        color={COLORS.success}
      />
      <StatusCard
        title="Comissões Pagas"
        value={`R$ ${stats.totalPaidCommissions.toFixed(2)}`}
        subtitle="Total pago em comissões"
        color={COLORS.warning}
      />

      <Text style={styles.sectionTitle}>Top 10 Afiliados</Text>
      {topAffiliates.map((a, index) => (
        <View key={index} style={styles.affiliateItem}>
          <BarChart size={16} color={COLORS.text} style={{ marginRight: 8 }} />
          <Text style={styles.affiliateText}>
            {index + 1}. {a.name} - R$ {a.value.toFixed(2)}
          </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  affiliateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  affiliateText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
