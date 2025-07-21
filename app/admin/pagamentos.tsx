import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';
import { CreditCard } from 'lucide-react-native';
import Badge from '@/components/Badge';
import { useRouter } from 'expo-router';

export default function AdminPaymentsPanel() {
  const [comissoes, setComissoes] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          id,
          amount,
          status,
          created_at,
          affiliate_id,
          profiles:affiliate_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComissoes(data || []);
    } catch (err) {
      console.error('Erro ao buscar comissões:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const marcarComoPaga = (affiliateId: string) => {
    router.push({ pathname: '/PixQrCode', params: { id: affiliateId } });
  };

  const comissoesFiltradas = comissoes.filter((item) => {
    const nome = item?.profiles?.full_name?.toLowerCase?.() || '';
    return nome.includes(search.toLowerCase());
  });

  const paginated = comissoesFiltradas.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(comissoesFiltradas.length / pageSize);

  const getStatusInfo = (statusRaw: string | undefined) => {
    const status = statusRaw?.toLowerCase?.();
    if (status === 'paga' || status === 'paid') {
      return { label: 'Paga', color: COLORS.success };
    }
    return { label: 'Pagamento Pendente', color: COLORS.warning };
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestão de Pagamentos</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por afiliado"
          value={search}
          onChangeText={text => {
            setSearch(text);
            setPage(1);
          }}
        />
      </View>

      {paginated.length === 0 && (
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 20 }}>
          Nenhuma comissão encontrada.
        </Text>
      )}

      {paginated.map((item) => {
        const { label, color } = getStatusInfo(item.status);
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Afiliado:</Text>
              <Text style={styles.value}>{item.profiles?.full_name || '-'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Comissão:</Text>
              <Text style={styles.value}>R$ {item.amount?.toFixed(2)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Data:</Text>
              <Text style={styles.value}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Badge status={item.status} />
            </View>

            {label !== 'Paga' && (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => marcarComoPaga(item.affiliate_id)}
              >
                <CreditCard size={18} color="#fff" />
                <Text style={styles.payButtonText}>Marcar como Paga</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPage(p)}
              style={[
                styles.pageButton,
                page === p && { backgroundColor: COLORS.primary },
              ]}
            >
              <Text
                style={{
                  color: page === p ? '#fff' : COLORS.text,
                  fontWeight: 'bold',
                }}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    padding: 10,
    borderRadius: 8,
    color: COLORS.text,
  },
  searchContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  value: {
    color: COLORS.text,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  pageButton: {
    padding: 10,
    margin: 5,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 6,
  },
});
