import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { createClient } from '@/lib/supabase';
import { COLORS } from '@/constants/Colors';

const supabase = createClient();

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useGlobalSearchParams();

  useEffect(() => {
    const hash = window?.location?.hash;
    if (hash && hash.includes('type=recovery')) {
      const query = new URLSearchParams(hash.replace('#', ''));
      const access_token = query.get('access_token');

      if (access_token) {
        supabase.auth.setSession({ access_token, refresh_token: '' });
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        Alert.alert('Erro', 'Não foi possível redefinir a senha.');
      } else {
        Alert.alert('Sucesso', 'Senha redefinida com sucesso!');
        router.replace('/');
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redefinir Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Nova senha"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar nova senha</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 56,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
