import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BarChart } from 'react-native-chart-kit';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function CommissionChartsScreen() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user?.id) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('affiliate_id', user.id);

      if (!error && data) {
        setCommissions(data);
      } else {
        console.error('Erro ao buscar comissões:', error);
      }
    };

    fetchCommissions();
  }, [user]);

  const groupByMonth = () => {
    const result: { [key: string]: { paid: number; pending: number } } = {};

    commissions.forEach((c) => {
      const date = new Date(c.created_at);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!result[key]) result[key] = { paid: 0, pending: 0 };
      result[key][c.status] += c.amount;
    });

    const labels = Object.keys(result);
    const paidData = labels.map((label) => result[label].paid);
    const pendingData = labels.map((label) => result[label].pending);

    return { labels, paidData, pendingData };
  };

  const { labels, paidData, pendingData } = groupByMonth();
  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Estatísticas de Comissões</Text>

      <Text style={styles.subtitle}>Comissões Pagas</Text>
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: paidData,
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig('#22c55e')}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />

      <Text style={styles.subtitle}>Comissões Pendentes</Text>
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: pendingData,
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig('#f59e0b')}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />
    </ScrollView>
  );
}

function chartConfig(barColor: string) {
  return {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForBackgroundLines: {
      stroke: '#e0e0e0',
    },
    propsForLabels: {
      fontSize: 12,
    },
    fillShadowGradient: barColor,
    fillShadowGradientOpacity: 1,
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
});
