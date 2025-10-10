import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { ref } = useLocalSearchParams(); // 🔗 Captura o ID do afiliado indicador

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    address: '',
    pixKey: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // 🔹 Cria o usuário no Supabase Auth
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        cpf: formData.cpf,
        address: formData.address,
        pixKey: formData.pixKey,
      });

      if (error) throw error;

      const newUser = data?.user;
      if (!newUser) throw new Error('Erro ao criar o usuário');

      // 🔹 Se veio um afiliado indicador na URL, registra na tabela `indicacoes`
      if (ref) {
        const { error: indicacaoError } = await supabase.from('indicacoes').insert({
          afiliado_indicador_id: ref,
          afiliado_indicado_id: newUser.id,
          data_indicacao: new Date().toISOString(),
        });

        if (indicacaoError) console.warn('Erro ao registrar indicação:', indicacaoError);
      }

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      router.replace('/(tabs)/');
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      Alert.alert('Erro', err.message || 'Não foi possível realizar o cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>
        Criar conta
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={formData.fullName}
        onChangeText={(text) => handleChange('fullName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(text) => handleChange('phone', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="CPF"
        keyboardType="numeric"
        value={formData.cpf}
        onChangeText={(text) => handleChange('cpf', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Endereço"
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Chave PIX"
        value={formData.pixKey}
        onChangeText={(text) => handleChange('pixKey', text)}
      />

      {ref && (
        <View style={styles.refBox}>
          <Text style={{ color: '#2d6a4f', fontSize: 14 }}>
            🔗 Você está se cadastrando com o link de indicação de um afiliado.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={{ textAlign: 'center', marginTop: 16 }}>
          Já tem uma conta? <Text style={{ color: '#2d6a4f' }}>Entrar</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2d6a4f',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  refBox: {
    backgroundColor: '#d8f3dc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
};