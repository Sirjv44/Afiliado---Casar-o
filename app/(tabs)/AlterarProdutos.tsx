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

export default function EditProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
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

    fetchProducts();
  }, []);

  const handleUpdate = async (index: number) => {
    const product = products[index]; // ← ESTA LINHA FALTAVA
  
    const { name, price, stock, description, category, image_url } = product;
  
    const parsedPrice = parseFloat(String(price).replace(',', '.'));
    const parsedStock = parseInt(String(stock), 10);
  
    const supabase = createClient(); // ← também precisa garantir isso aqui
  
    const { error } = await supabase
      .from('products')
      .update({
        name,
        price: parsedPrice,
        stock: parsedStock,
        description,
        category,
        image_url,
      })
      .eq('id', product.id);
  
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
    } else {
      setSuccessMessage('Produto atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };
  

  const handleChange = (index: number, field: string, value: string) => {
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value, // mantém como string
    };
    setProducts(newProducts);
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

      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      {filteredProducts.map((product, index) => (
        <View key={product.id} style={styles.card}>
          <Text style={styles.label}>Nome:</Text>
          <TextInput
            style={styles.input}
            value={product.name}
            onChangeText={(text) => handleChange(index, 'name', text)}
          />

          <Text style={styles.label}>Preço:</Text>
          <TextInput
            style={styles.input}
            value={String(product.price)}
            keyboardType="default"
            onChangeText={(text) => handleChange(index, 'price', text)}
          />


          <Text style={styles.label}>Estoque:</Text>
          <TextInput
            style={styles.input}
            value={String(product.stock)}
            keyboardType="numeric"
            onChangeText={(text) => handleChange(index, 'stock', text)}
          />

          <Text style={styles.label}>Descrição:</Text>
          <TextInput
            style={styles.input}
            value={product.description || ''}
            onChangeText={(text) => handleChange(index, 'description', text)}
          />

          <Text style={styles.label}>Categoria:</Text>
          <TextInput
            style={styles.input}
            value={product.category || ''}
            onChangeText={(text) => handleChange(index, 'category', text)}
          />

          <Text style={styles.label}>Imagem (URL):</Text>
          <TextInput
            style={styles.input}
            value={product.image_url || ''}
            onChangeText={(text) => handleChange(index, 'image_url', text)}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleUpdate(index)}
          >
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>
      ))}
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
