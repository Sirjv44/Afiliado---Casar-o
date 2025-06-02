import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  cpf: string;
  address: string;
  pixKey: string;
  admin: boolean;
}

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    cpf: string;
    address: string;
    pixKey: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storage = {
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  const supabase = createClient();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionStr = await storage.getItem('session');
        const userStr = await storage.getItem('user');

        if (sessionStr && userStr) {
          const session = JSON.parse(sessionStr);
          const user = JSON.parse(userStr);

          console.log('Usuário restaurado:', user); // ← log de depuração

          setState({
            session,
            user,
            isLoading: false,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) throw new Error('Email ou senha incorretos.');

      const userId = data.user.id;

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !userData)
        throw new Error('Perfil do usuário não encontrado.');

      const user: User = {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        phone: userData.phone,
        cpf: userData.cpf,
        address: userData.address,
        pixKey: userData.pix_key,
        admin: userData.admin ?? false,
      };

      await storage.setItem('session', JSON.stringify(data.session));
      await storage.setItem('user', JSON.stringify(user));
      await storage.setItem('userToken', data.session?.access_token || '');

      setState({
        session: data.session,
        user,
        isLoading: false,
      });

      router.replace('/(tabs)/');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    cpf: string;
    address: string;
    pixKey: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error || !data.user) throw error;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone,
        cpf: userData.cpf,
        address: userData.address,
        pix_key: userData.pixKey,
        admin: false,
        created_at: new Date(),
      });

      if (profileError) throw profileError;

      await signIn(userData.email, userData.password);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await Promise.all([
        storage.removeItem('session'),
        storage.removeItem('user'),
        storage.removeItem('userToken'),
      ]);

      setState({
        session: null,
        user: null,
        isLoading: false,
      });

      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
