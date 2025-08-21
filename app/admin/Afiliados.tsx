import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';

export default function AffiliatesScreen() {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [salesFilter, setSalesFilter] = useState<'all' | 'withSales' | 'withoutSales'>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('admin')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Erro ao verificar se é admin:', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.admin === true);
      }
    };

    if (user?.id) checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      const supabase = createClient();

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, address')
        .eq('admin', false)
        .neq('id', user?.id);

      if (error) {
        console.error('Erro ao buscar afiliados:', error.message);
        setLoading(false);
        return;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('affiliate_id')
        .eq('status', 'delivered');

      if (ordersError) {
        console.error('Erro ao buscar vendas:', ordersError.message);
      }

      const salesCount: Record<string, number> = {};
      orders?.forEach((o) => {
        if (!salesCount[o.affiliate_id]) salesCount[o.affiliate_id] = 0;
        salesCount[o.affiliate_id] += 1;
      });

      const enriched = profiles.map((a) => ({
        ...a,
        totalSales: salesCount[a.id] || 0,
      }));

      setAffiliates(enriched);
      setFilteredAffiliates(enriched);
      setLoading(false);
    };

    if (user?.id && isAdmin === true) fetchAffiliates();
    else if (isAdmin === false) setLoading(false);
  }, [user?.id, isAdmin]);

  useEffect(() => {
    let filtered = affiliates.filter((affiliate) =>
      affiliate.full_name.toLowerCase().includes(searchText.toLowerCase())
    );

    if (salesFilter === 'withSales') {
      filtered = filtered.filter((a) => a.totalSales > 0);
    } else if (salesFilter === 'withoutSales') {
      filtered = filtered.filter((a) => a.totalSales === 0);
    }

    setFilteredAffiliates(filtered);
  }, [searchText, affiliates, salesFilter]);

  if (loading || isAdmin === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Acesso restrito. Esta área é apenas para administradores.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Afiliados</Text>

      {/* RESUMO */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total de Afiliados</Text>
          <Text style={styles.summaryValue}>{affiliates.length}</Text>
        </View>
      </View>

      {/* Campo de busca */}
      <TextInput
        style={styles.input}
        placeholder="Pesquisar por nome..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Filtro de vendas */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Text style={styles.dropdownButtonText}>
            {salesFilter === 'all' ? 'Todos' : salesFilter === 'withSales' ? 'Com vendas' : 'Sem vendas'}
          </Text>
        </TouchableOpacity>
        {dropdownOpen && (
          <View style={styles.dropdownOptions}>
            <TouchableOpacity onPress={() => { setSalesFilter('all'); setDropdownOpen(false); }}>
              <Text style={styles.dropdownOptionText}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSalesFilter('withSales'); setDropdownOpen(false); }}>
              <Text style={styles.dropdownOptionText}>Com vendas</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSalesFilter('withoutSales'); setDropdownOpen(false); }}>
              <Text style={styles.dropdownOptionText}>Sem vendas</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Lista de afiliados */}
      {filteredAffiliates.length === 0 ? (
        <Text style={styles.errorText}>Nenhum afiliado encontrado.</Text>
      ) : (
        filteredAffiliates.map((affiliate) => (
          <TouchableOpacity
            key={affiliate.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/PixQrCode',
                params: { id: affiliate.id },
              })
            }
          >
            <Text style={styles.name}>{affiliate.full_name}</Text>
            <Text style={styles.email}>{affiliate.email}</Text>
            <Text style={styles.phone}>📞 {affiliate.phone || 'Sem telefone'}</Text>
            <Text style={styles.address}>📍 {affiliate.address || 'Sem endereço informado'}</Text>
            <Text style={styles.sales}>🛒 {affiliate.totalSales} vendas</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: COLORS.text },
  input: { backgroundColor: COLORS.cardAlt, color: COLORS.text, padding: 10, borderRadius: 8, marginBottom: 16 },
  sales: { fontSize: 14, color: COLORS.success, marginTop: 4, fontWeight: '600' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: COLORS.cardAlt, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textSecondary },
  phone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  address: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  errorText: { padding: 16, fontSize: 16, color: 'red', textAlign: 'center' },
  dropdownContainer: { marginBottom: 16 },
  dropdownButton: { backgroundColor: COLORS.cardAlt, padding: 10, borderRadius: 8 },
  dropdownButtonText: { color: COLORS.text, fontSize: 14 },
  dropdownOptions: { backgroundColor: COLORS.card, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  dropdownOptionText: { padding: 10, fontSize: 14, color: COLORS.text },
});
