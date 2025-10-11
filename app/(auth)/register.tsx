import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Mail, User, Phone, Key, Hash, MapPin } from 'lucide-react-native';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [referredBy, setReferredBy] = useState<string | null>(null);

  // Captura o parâmetro "ref" da URL (ex: ?ref=uuid)
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params?.ref) {
      setReferredBy(params.ref as string);
      console.log("🔗 Afiliado indicado por:", params.ref);
    }
  }, [params]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    pixKey: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const validateForm = () => {
    const emptyFields = Object.entries(formData).filter(([_, value]) => !value).map(([key]) => key);
    setHighlightedFields(emptyFields);

    if (emptyFields.length > 0) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não conferem.');
      setHighlightedFields((prev) => [...new Set([...prev, 'password', 'confirmPassword'])]);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erro', 'Email inválido.');
      setHighlightedFields((prev) => [...new Set([...prev, 'email'])]);
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      setHighlightedFields((prev) => [...new Set([...prev, 'password'])]);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        cpf: formData.cpf,
        address: formData.address,
        pixKey: formData.pixKey,
        referredBy, // 👈 Adiciona o afiliado indicador (caso exista)
      });

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      router.replace('/(tabs)/');
    } catch (error) {
      console.error('❌ Registration error:', error);
      Alert.alert('Erro', 'Não foi possível realizar o cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (field: string) => [
    styles.inputContainer,
    highlightedFields.includes(field) && { borderColor: 'red', borderWidth: 1 },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg' }} 
            style={styles.headerImage} 
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.title}>Cadastre-se como Afiliado</Text>
            <Text style={styles.subtitle}>Venda suplementos e ganhe comissões</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={getInputStyle('fullName')}>
            <User size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
            />
          </View>

          <View style={getInputStyle('email')}>
            <Mail size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
            />
          </View>

          <View style={getInputStyle('phone')}>
            <Phone size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
            />
          </View>

          <View style={getInputStyle('cpf')}>
            <Hash size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="CPF"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={formData.cpf}
              onChangeText={(text) => handleChange('cpf', text)}
            />
          </View>

          <View style={getInputStyle('address')}>
            <MapPin size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Endereço Completo"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
            />
          </View>

          <View style={getInputStyle('pixKey')}>
            <Key size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Chave Pix"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.pixKey}
              onChangeText={(text) => handleChange('pixKey', text)}
            />
          </View>

          <View style={getInputStyle('password')}>
            <Key size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
            />
          </View>

          <View style={getInputStyle('confirmPassword')}>
            <Key size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar Senha"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
            />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>CRIAR CONTA</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLinkText}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  headerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    marginLeft: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
