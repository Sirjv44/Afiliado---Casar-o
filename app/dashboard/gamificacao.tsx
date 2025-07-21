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
import { useAuth } from '@/context/AuthContext';

export default function GamificacaoScreen() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [recordePessoal, setRecordePessoal] = useState(0);
  const [maiorVenda, setMaiorVenda] = useState(1); // evita divisão por 0

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const supabase = createClient();

        // Período atual - mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: orders } = await supabase
          .from('orders')
          .select('affiliate_id, total_amount')
          .eq('status', 'delivered')
          .gte('created_at', startOfMonth.toISOString());

        const salesByAffiliate = {};

        orders?.forEach((o) => {
          if (!salesByAffiliate[o.affiliate_id]) {
            salesByAffiliate[o.affiliate_id] = 0;
          }
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
        if (currentUser) setRecordePessoal(currentUser.total);

        const maior = Math.max(...enriched.map((r) => r.total), 1);
        setMaiorVenda(maior);
      } catch (err) {
        console.error('Erro no ranking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [user?.id]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ranking de Afiliados - Mês Atual</Text>

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
              {item.isCurrentUser && (
                <Text style={styles.badge}>🎉 Seu melhor mês!</Text>
              )}
            </View>
          </View>
        ))
      )}

      {!loading && ranking.length === 0 && (
        <Text style={styles.empty}>Nenhuma venda registrada este mês.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  highlightCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  position: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoContainer: {
    marginTop: 6,
  },
  name: {
    fontSize: 16,
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  total: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  badge: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 40,
  },
});
