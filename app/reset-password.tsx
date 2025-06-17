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
import { useRouter } from 'expo-router';
import { createClient } from '@/lib/supabase';
import { COLORS } from '@/constants/Colors';

const supabase = createClient();

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!data?.session) {
        Alert.alert('Erro', 'Sessão inválida. Por favor, tente o link novamente.');
        router.replace('/');
      } else {
        setSessionChecked(true);
      }
    };
    checkSession();
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
        router.replace('/(tabs)/login');
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
