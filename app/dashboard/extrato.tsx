import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/Badge';
import * as Print from 'expo-print';

export default function AffiliateExtract() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCommissions = async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('commissions')
          .select('*')
          .eq('affiliate_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCommissions(data);
      } catch (err) {
        console.error('Erro ao buscar extrato:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [user?.id]);

  const filtered = commissions.filter((c) => {
    const product = c.product_name?.toLowerCase() || '';
    const date = new Date(c.created_at).toLocaleDateString();
    return product.includes(search.toLowerCase()) || date.includes(search);
  });

  const handleExportPDF = async () => {
    const html = `
      <html>
      <body>
        <h1>Extrato de Comissões</h1>
        <table border="1" style="width:100%; border-collapse: collapse;">
          <tr>
            <th>Data</th>
            <th>Produto</th>
            <th>Valor</th>
            <th>Comissão (%)</th>
            <th>Comissão R$</th>
            <th>Status</th>
          </tr>
          ${filtered
            .map(
              (item) => `
            <tr>
              <td>${new Date(item.created_at).toLocaleDateString()}</td>
              <td>${item.product_name}</td>
              <td>R$ ${item.order_value?.toFixed(2)}</td>
              <td>${item.percentage}%</td>
              <td>R$ ${item.amount?.toFixed(2)}</td>
              <td>${item.status}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </body>
      </html>
    `;

    await Print.printAsync({ html });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando extrato...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Extrato de Comissões</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por produto ou data..."
        placeholderTextColor={COLORS.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
        <Text style={styles.exportText}>Exportar PDF</Text>
      </TouchableOpacity>

      {filtered.map((item, index) => (
        <View key={index} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.product}>{item.product_name}</Text>
            <Text style={styles.details}>
              {new Date(item.created_at).toLocaleDateString()} | R$ {item.order_value?.toFixed(2)}
            </Text>
            <Text style={styles.details}>
              Comissão: {item.percentage}% = R$ {item.amount?.toFixed(2)}
            </Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    marginBottom: 12,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  product: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  details: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
});