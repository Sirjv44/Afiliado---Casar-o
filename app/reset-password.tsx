import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
    const restoreSession = async () => {
      // 1️⃣ Captura tanto ?query quanto #hash ─ cobre os dois formatos
      const raw =
        typeof window !== 'undefined'
          ? window.location.search || window.location.hash
          : '';

      const params = new URLSearchParams(raw.replace(/^[?#]/, ''));
      const access_token  = params.get('access_token');
      const refresh_token = params.get('refresh_token') ?? '';

      // 2️⃣ Exibe mensagem de link expirado/errado
      if (params.get('error_code') === '403') {
        Alert.alert('Link expirado', 'Solicite uma nova redefinição de senha.');
        router.replace('/');
        return;
      }

      // 3️⃣ Se tiver token, cria sessão; senão cai fora
      if (access_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          Alert.alert('Erro', 'Falha ao restaurar sessão. Tente o link novamente.');
          router.replace('/');
          return;
        }
      }

      // 4️⃣ Confirma que a sessão existe
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionChecked(true);
      } else {
        Alert.alert('Erro', 'Sessão não encontrada.');
        router.replace('/');
      }
    };

    restoreSession();
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
