import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';

export default function AffiliatesScreen() {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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

    if (user?.id) {
      checkAdmin();
    }
  }, [user]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, address')
        .eq('admin', false)
        .neq('id', user?.id);

      if (error) {
        console.error('Erro ao buscar afiliados:', error.message);
      } else {
        setAffiliates(data);
      }

      setLoading(false);
    };

    if (user?.id && isAdmin === true) {
      fetchAffiliates();
    } else if (isAdmin === false) {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

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
      {affiliates.length === 0 ? (
        <Text style={styles.errorText}>Nenhum afiliado encontrado.</Text>
      ) : (
        affiliates.map((affiliate) => (
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
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  phone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorText: {
    padding: 16,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});
