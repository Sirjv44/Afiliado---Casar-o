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

export default function UsuariosScreen() {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Erro ao carregar usuários:', error.message);
    } else {
      const normalizados = data.map((p) => ({
        ...p,
        fullName: p.full_name,
        pixKey: p.pix_key,
      }));
      setProfiles(normalizados);
      setFilteredProfiles(normalizados);
    }
    setLoading(false);
  };

  const handleChange = (id: string, field: string, value: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    setFilteredProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleUpdate = async (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    const { id: _, password, fullName, pixKey, ...rest } = profile;

    const dataToUpdate = {
      ...rest,
      full_name: fullName,
      pix_key: pixKey,
    };

    const supabase = createClient();
    const { error } = await supabase.from('profiles').update(dataToUpdate).eq('id', id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o usuário.');
    } else {
      setSuccessMessage('Usuário atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente excluir este usuário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const supabase = createClient();
          const { error } = await supabase.from('profiles').delete().eq('id', id);

          if (error) {
            Alert.alert('Erro', 'Não foi possível excluir o usuário.');
          } else {
            const novos = profiles.filter((p) => p.id !== id);
            setProfiles(novos);
            setFilteredProfiles(novos);
            setSuccessMessage('Usuário excluído com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        },
      },
    ]);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    const termo = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    const filtrados = profiles.filter((p) =>
      p.fullName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').includes(termo)
    );
    setFilteredProfiles(filtrados);
  };

  const campos = [
    { key: 'email', label: 'E-mail' },
    { key: 'fullName', label: 'Nome Completo' },
    { key: 'phone', label: 'Telefone' },
    { key: 'cpf', label: 'CPF' },
    { key: 'address', label: 'Endereço' },
    { key: 'pixKey', label: 'Chave PIX' },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando usuários...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Usuários</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nome..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchText}
        onChangeText={handleSearch}
      />

      {successMessage && <Text style={styles.successText}>{successMessage}</Text>}

      {filteredProfiles.map((user) => (
        <View key={user.id} style={styles.card}>
          {campos.map(({ key, label }) => (
            <View key={key}>
              <Text style={styles.label}>{label}:</Text>
              <TextInput
                style={styles.input}
                value={user[key] || ''}
                onChangeText={(text) => handleChange(user.id, key, text)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={() => handleUpdate(user.id)}>
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'red', marginTop: 8 }]}
            onPress={() => handleDelete(user.id)}
          >
            <Text style={styles.buttonText}>Excluir Usuário</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
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
