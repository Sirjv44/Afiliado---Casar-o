import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';

export default function OrderDetailScreen() {
  const { order_id } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const supabase = createClient();

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('quantity, price, products (name, image_url, description)')
        .eq('order_id', order_id);

      if (itemsError) {
        console.error('Erro ao buscar itens do pedido:', itemsError.message);
      } else {
        setProducts(itemsData);
      }

      setLoading(false);
    };

    if (order_id) {
      fetchOrderDetails();
    }
  }, [order_id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalhes do Pedido</Text>

      {products.map((item, index) => (
        <View key={index} style={styles.card}>
          <Image
            source={{ uri: item.products.image_url }}
            style={styles.image}
          />
          <View style={styles.details}>
            <Text style={styles.name}>{item.products.name}</Text>
            <Text style={styles.description}>{item.products.description}</Text>
            <Text style={styles.text}>Quantidade: {item.quantity}</Text>
            <Text style={styles.text}>Preço: R$ {item.price.toFixed(2)}</Text>
          </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
  },
});
