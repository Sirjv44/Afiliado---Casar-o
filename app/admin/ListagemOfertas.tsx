import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { createClient } from '@/lib/supabase';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import moment from 'moment';

export default function ListagemOfertas() {
  const supabase = createClient();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('weekly_offers')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ofertas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as ofertas.');
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleEdit = (offer: any) => {
    router.push({
      pathname: '/admin/OfertasSemana',
      params: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        startDate: moment(offer.start_date).format('DD-MM-YYYY'),
        endDate: moment(offer.end_date).format('DD-MM-YYYY'),
      },
    });
  };

  const handleDelete = async (offerId: string) => {
    setLoading(true);
    try {
      // Excluir imagens
      const { error: imageError } = await supabase
        .from('weekly_offer_images')
        .delete()
        .eq('offer_id', offerId);

      if (imageError) {
        console.error('Erro ao excluir imagens:', imageError);
        Alert.alert('Erro', 'Erro ao excluir as imagens da oferta.');
        setLoading(false);
        return;
      }

      // Excluir a oferta principal
      const { error: offerError } = await supabase
        .from('weekly_offers')
        .delete()
        .eq('id', offerId);

      if (offerError) {
        console.error('Erro ao excluir oferta:', offerError);
        Alert.alert('Erro', 'Erro ao excluir a oferta.');
        setLoading(false);
        return;
      }

      // Sucesso
      if (Platform.OS === 'android') {
        ToastAndroid.show('Oferta excluída com sucesso!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Sucesso', 'Oferta excluída com sucesso!');
      }

      await fetchOffers();
    } catch (err) {
      console.error('Erro inesperado:', err);
      Alert.alert('Erro inesperado', 'Não foi possível excluir a oferta.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOffer = () => {
    router.push('/admin/OfertasSemana');
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.offerItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerDates}>
          {moment(item.start_date).format('DD/MM/YYYY')} até{' '}
          {moment(item.end_date).format('DD/MM/YYYY')}
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text }}>Carregando ofertas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newOfferButton} onPress={handleNewOffer}>
        <Text style={styles.newOfferText}>+ Nova Oferta</Text>
      </TouchableOpacity>

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  newOfferButton: {
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  newOfferText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  offerItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  offerTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  offerDates: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
