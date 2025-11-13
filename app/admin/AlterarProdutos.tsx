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

// Tipagem básica para um produto
interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number | string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  commission_percentage: number | string | null;
}

export default function EditProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
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
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
    } else {
      // Garante que todos os valores para o TextInput sejam strings
      const formattedData: Product[] = data.map((p: any) => ({
        ...p,
        name: String(p.name ?? ''), // Garantindo que o nome é uma string
        price: String(p.price ?? ''),
        stock: String(p.stock ?? ''),
        commission_percentage: String(p.commission_percentage ?? ''),
      }));
      setProducts(formattedData);
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

  // 🛠️ Função de alteração de estado imutável
  const handleChange = (productId: string, field: keyof Product, value: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
    );
  };

  const handleUpdate = async (productId: string) => {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return;
    const product = products[index];

    // Trata a conversão de strings para números, aceitando vírgula como separador decimal
    const parsedPrice = parseFloat(String(product.price).replace(',', '.'));
    const parsedStock = parseInt(String(product.stock), 10);
    const parsedCommission = parseFloat(String(product.commission_percentage || 0).replace(',', '.'));

    if (isNaN(parsedPrice) || isNaN(parsedStock) || isNaN(parsedCommission)) {
        Alert.alert('Erro', 'Por favor, insira valores numéricos válidos para Preço, Estoque e Comissão.');
        return;
    }
    
    // Verifica se o nome não está vazio antes de salvar
    if (!product.name.trim()) {
        Alert.alert('Erro', 'O nome do produto não pode ser vazio.');
        return;
    }

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
        commission_percentage: parsedCommission,
      })
      .eq('id', product.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto. Detalhes: ' + error.message);
    } else {
      setSuccessMessage('Produto atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza de que deseja excluir este produto? Esta ação é irreversível.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            const supabase = createClient();
            const { error } = await supabase.from('products').delete().eq('id', productId);

            if (error) {
              console.error('Erro ao excluir produto:', error.message);
              Alert.alert('Erro', 'Não foi possível excluir o produto.');
            } else {
              setProducts((prev) => prev.filter((p) => p.id !== productId));
              setSuccessMessage('Produto excluído com sucesso!');
              setTimeout(() => setSuccessMessage(''), 3000);
            }
          },
          style: 'destructive'
        },
      ]
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
            {/* 🐛 O componente é vinculado ao estado e ao ID do produto (key) */}
            <TextInput
              style={styles.input}
              value={String(product.name)} // Garante que o valor é sempre uma string
              onChangeText={(text) => handleChange(product.id, 'name', text)}
            />

            <Text style={styles.label}>Preço:</Text>
            <TextInput
              style={styles.input}
              value={String(product.price)}
              keyboardType="decimal-pad"
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

            <Text style={styles.label}>Comissão (%):</Text>
            <TextInput
              style={styles.input}
              value={String(product.commission_percentage || '')}
              keyboardType="decimal-pad"
              onChangeText={(text) =>
                handleChange(product.id, 'commission_percentage', text)
              }
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleUpdate(product.id)}
            >
              <Text style={styles.buttonText}>Salvar Alterações</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
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
  // 🟢 Estilo da mensagem de sucesso
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065f46', // verde escuro
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
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
  deleteButton: {
    backgroundColor: 'red',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});