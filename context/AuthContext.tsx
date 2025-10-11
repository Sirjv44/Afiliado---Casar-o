import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  cpf: string;
  address: string;
  pixKey: string;
  admin: boolean;
  referredBy?: string | null;
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
    referredBy?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  const supabase = createClient();

  // 🔹 Carrega sessão e perfil ao iniciar
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const userId = session.user.id;

          const { data: userData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) throw error;
          if (userData) {
            const user: User = {
              id: userData.id,
              email: userData.email,
              fullName: userData.full_name,
              phone: userData.phone,
              cpf: userData.cpf,
              address: userData.address,
              pixKey: userData.pix_key,
              admin: userData.admin ?? false,
              referredBy: userData.referred_by ?? null,
            };

            setState({ user, session, isLoading: false });
          }
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

  // 🔹 Login
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
        referredBy: userData.referred_by ?? null,
      };

      setState({
        user,
        session: data.session,
        isLoading: false,
      });

      router.replace('/(tabs)/');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  // 🔹 Cadastro com indicação opcional
  const signUp = async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    cpf: string;
    address: string;
    pixKey: string;
    referredBy?: string | null;
  }) => {
    try {
      // Cria usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error || !data.user) throw error;

      // Cria registro na tabela profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone,
        cpf: userData.cpf,
        address: userData.address,
        pix_key: userData.pixKey,
        admin: false,
        referred_by: userData.referredBy || null, // 🔗 salva quem indicou
        created_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // 🔹 Registra a indicação (se tiver)
      if (userData.referredBy) {
        const { error: indicacaoError } = await supabase
          .from('indicacoes')
          .insert({
            afiliado_indicador_id: userData.referredBy,
            afiliado_indicado_id: data.user.id,
            data_indicacao: new Date().toISOString(),
          });

        if (indicacaoError)
          console.warn('Erro ao registrar indicação:', indicacaoError);
      }

      // Faz login automático após o cadastro
      await signIn(userData.email, userData.password);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  };

  // 🔹 Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({ user: null, session: null, isLoading: false });
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

// 🔹 Hook personalizado para usar autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
