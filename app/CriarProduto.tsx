import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function CreateProductScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    category: '',
    image_url: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const supabase = createClient();

    // Verificar se produto com mesmo nome já existe
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .ilike('name', form.name.trim()) // checagem case-insensitive
      .maybeSingle();

    if (checkError) {
      console.error('Erro ao verificar duplicação:', checkError.message);
      Alert.alert('Erro', 'Erro ao verificar duplicação.');
      return;
    }

    if (existingProduct) {
      Alert.alert('Produto já cadastrado', 'Já existe um produto com esse nome.');
      return;
    }

    // Inserir novo produto
    const { error } = await supabase.from('products').insert([
      {
        name: form.name.trim(),
        price: parseFloat(form.price.replace(',', '.')),
        stock: parseInt(form.stock),
        description: form.description,
        category: form.category,
        image_url: form.image_url,
      },
    ]);

    if (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o produto.');
    } else {
      Alert.alert('Sucesso', 'Produto adicionado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adicionar Novo Produto</Text>

      <TextInput
        placeholder="Nome"
        style={styles.input}
        value={form.name}
        onChangeText={(text) => handleChange('name', text)}
      />
      <TextInput
        placeholder="Preço"
        style={styles.input}
        value={form.price}
        keyboardType="decimal-pad"
        onChangeText={(text) => handleChange('price', text)}
      />
      <TextInput
        placeholder="Estoque"
        style={styles.input}
        value={form.stock}
        keyboardType="numeric"
        onChangeText={(text) => handleChange('stock', text)}
      />
      <TextInput
        placeholder="Descrição"
        style={styles.input}
        value={form.description}
        onChangeText={(text) => handleChange('description', text)}
      />
      <TextInput
        placeholder="Categoria"
        style={styles.input}
        value={form.category}
        onChangeText={(text) => handleChange('category', text)}
      />
      <TextInput
        placeholder="URL da Imagem"
        style={styles.input}
        value={form.image_url}
        onChangeText={(text) => handleChange('image_url', text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar Produto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
