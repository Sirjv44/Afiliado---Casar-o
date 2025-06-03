import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { success } = useLocalSearchParams();

  const fetchProducts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Erro ao buscar produtos:', error.message);
    } else {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (success === '1') {
      setSuccessMessage('Produto adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [success]);

  const handleUpdate = async (productId: string) => {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return;
    const product = products[index];

    const parsedPrice = parseFloat(String(product.price).replace(',', '.'));
    const parsedStock = parseInt(String(product.stock), 10);

    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        price: parsedPrice,
        stock: parsedStock,
        description: product.description,
        category: product.category,
        image_url: product.image_url,
      })
      .eq('id', product.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
    } else {
      setSuccessMessage('Produto atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async (productId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      console.error('Erro ao excluir produto:', error.message);
      Alert.alert('Erro', 'Não foi possível excluir o produto.');
    } else {
      setSuccessMessage('Produto excluído com sucesso!');
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleChange = (productId: string, field: string, value: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
    );
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar produto pelo nome..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchText}
        onChangeText={setSearchText}
      />

      <TouchableOpacity
        style={[styles.button, { marginBottom: 16 }]}
        onPress={() => router.push('/CriarProduto')}
      >
        <Text style={styles.buttonText}>Incluir Produto</Text>
      </TouchableOpacity>

      {successMessage && <Text style={styles.successText}>{successMessage}</Text>}

      {filteredProducts.length === 0 ? (
        <Text style={styles.noResultsText}>Nenhum produto encontrado.</Text>
      ) : (
        filteredProducts.map((product) => (
          <View key={product.id} style={styles.card}>
            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={product.name}
              onChangeText={(text) => handleChange(product.id, 'name', text)}
            />

            <Text style={styles.label}>Preço:</Text>
            <TextInput
              style={styles.input}
              value={String(product.price)}
              keyboardType="default"
              onChangeText={(text) => handleChange(product.id, 'price', text)}
            />

            <Text style={styles.label}>Estoque:</Text>
            <TextInput
              style={styles.input}
              value={String(product.stock)}
              keyboardType="numeric"
              onChangeText={(text) => handleChange(product.id, 'stock', text)}
            />

            <Text style={styles.label}>Descrição:</Text>
            <TextInput
              style={styles.input}
              value={product.description || ''}
              onChangeText={(text) =>
                handleChange(product.id, 'description', text)
              }
            />

            <Text style={styles.label}>Categoria:</Text>
            <TextInput
              style={styles.input}
              value={product.category || ''}
              onChangeText={(text) => handleChange(product.id, 'category', text)}
            />

            <Text style={styles.label}>Imagem (URL):</Text>
            <TextInput
              style={styles.input}
              value={product.image_url || ''}
              onChangeText={(text) =>
                handleChange(product.id, 'image_url', text)
              }
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleUpdate(product.id)}
            >
              <Text style={styles.buttonText}>Salvar Alterações</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'red', marginTop: 8 }]}
              onPress={() => handleDelete(product.id)}
            >
              <Text style={styles.buttonText}>Excluir Produto</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
  },
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  searchInput: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    color: COLORS.text,
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  noResultsText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  label: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
