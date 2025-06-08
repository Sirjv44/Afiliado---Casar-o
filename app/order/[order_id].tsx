import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';

export default function OrderDetailScreen() {
  const { order_id } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [orderInfo, setOrderInfo] = useState({ client_address: '', notes: '', client_phone: '' });
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

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

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('client_address, notes, client_phone')
        .eq('id', order_id)
        .single();

      if (orderError) {
        console.error('Erro ao buscar informações do pedido:', orderError.message);
      } else if (orderData) {
        setOrderInfo(orderData);
      }

      setLoading(false);
    };

    if (order_id) {
      fetchOrderDetails();
    }
  }, [order_id]);

  const filteredProducts = products.filter((item) => {
    const name = item.products.name?.toLowerCase() || '';
    const description = item.products.description?.toLowerCase() || '';
    const search = searchText.toLowerCase();
    return name.includes(search) || description.includes(search);
  });

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

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Endereço:</Text>
        <Text style={styles.infoText}>{orderInfo.client_address || 'Não informado'}</Text>

        <Text style={styles.infoLabel}>Observações:</Text>
        <Text style={styles.infoText}>{orderInfo.notes || 'Nenhuma observação'}</Text>

        <Text style={styles.infoLabel}>Telefone:</Text>
        <Text style={styles.infoText}>{orderInfo.client_phone || 'Não informado'}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar produto..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchText}
        onChangeText={setSearchText}
      />

      {filteredProducts.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
      ) : (
        filteredProducts.map((item, index) => (
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
        ))
      )}
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
  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    marginBottom: 12,
    color: COLORS.textSecondary,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    color: COLORS.text,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
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
