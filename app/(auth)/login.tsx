import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail } from 'lucide-react-native';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';

const supabase = createClient();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await signIn(email, password);

      if (!error) {
        return;
      }

      console.log('Login pelo Auth falhou, tentando login via profiles...');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        Alert.alert('Erro de login', 'Email ou senha incorretos.');
        return;
      }

      const senhaCorreta = await bcrypt.compare(password, profile.password);

      if (!senhaCorreta) {
        Alert.alert('Erro de login', 'Email ou senha incorretos.');
        return;
      }

      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      router.replace('/(tabs)/index');

    } catch (error) {
      console.error(error);
      Alert.alert('Erro inesperado', 'Ocorreu um erro. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCatalogWeb = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('name, price, image_url');
  
      if (error || !products || products.length === 0) {
        alert('Nenhum produto encontrado.');
        return;
      }
  
      // Criar o conteúdo HTML
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center;">Catálogo de Produtos</h1>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
            ${products.map(p => `
              <div style="border: 1px solid #ccc; padding: 10px; border-radius: 8px; width: 200px; text-align: center;">
                <img src="${p.image_url}" style="width: 150px; height: 150px; object-fit: cover;" />
                <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">${p.name}</div>
                <div style="color: green; font-weight: bold; font-size: 13px;">R$ ${p.price.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
  
      // Criar um elemento temporário
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
  
      // Gerar e baixar PDF
      html2pdf()
        .from(container)
        .set({
          margin: 10,
          filename: 'catalogo.pdf',
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .save();
      
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o PDF.');
    }
  };
  
  const handleForgotPassword = async () => {
    if (!email) {
      setShowRecoveryMessage(true);
      return;
    }

    setShowRecoveryMessage(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://xn--afiliadocasaro-2hb.com/reset-password?recovery=1',
      });      

      if (error) {
        console.error(error);
        Alert.alert('Erro', 'Não foi possível enviar o link de recuperação.');
      } else {
        Alert.alert('Sucesso', 'Verifique seu e-mail para redefinir sua senha.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar recuperar a senha.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/6456150/pexels-photo-6456150.jpeg',
            }}
            style={styles.backgroundImage}
          />
          <View style={styles.overlay}>
            <Text style={styles.logoText}>CASARÃO</Text>
            <Text style={styles.logoSubText}>SUPLEMENTOS</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Login de Afiliado</Text>
          <Text style={styles.subtitle}>Entre com sua conta para vender</Text>

          <View style={styles.inputContainer}>
            <Mail size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          {/* Botão Baixar Catálogo */}
<TouchableOpacity
  style={[styles.button, { backgroundColor: COLORS.secondary, marginTop: 10 }]}
  onPress={handleDownloadCatalogWeb}
>
  <Text style={styles.buttonText}>BAIXAR CATÁLOGO</Text>
</TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={[styles.footerLink, { textDecorationLine: 'underline' }]}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>
            {showRecoveryMessage && (
              <Text style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>
                Digite seu e-mail acima para receber o link de redefinição.
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
  logoSubText: {
    fontSize: 16,
    color: COLORS.primary,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
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
    elevation: 2,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
