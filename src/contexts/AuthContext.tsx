import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

export type UserRole = 'admin' | 'comercial' | 'cx';

export interface AuthUser {
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'admin-certificacoes-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão do localStorage ao carregar
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.username && parsed.role) {
          setUser(parsed);
          console.log('🔐 [Auth] Sessão restaurada:', parsed.username);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔐 [Auth] Tentativa de login:', username);

    try {
      // Chamar a API do backend
      const response = await authAPI.login(username, password);

      console.log('🔐 [Auth] Resposta da API:', response);
      console.log('🔐 [Auth] response.success:', response.success);
      console.log('🔐 [Auth] response.user:', response.user);

      // Aceitar resposta se tiver user, mesmo sem success explícito
      if (response.user && (response.user.username && response.user.role)) {
        const authUser: AuthUser = {
          username: response.user.username,
          role: response.user.role as UserRole,
        };

        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        console.log('✅ [Auth] Login realizado:', authUser);

        return { success: true };
      }

      console.error('🔐 [Auth] Resposta inválida:', response);
      return { success: false, error: 'Resposta inválida do servidor' };

    } catch (error) {
      console.error('❌ [Auth] Erro no login:', error);

      // Parse error message
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';

      // Mensagens amigáveis baseadas no erro
      if (errorMessage.includes('Usuário não encontrado')) {
        return { success: false, error: 'Usuário não encontrado' };
      } else if (errorMessage.includes('Senha incorreta')) {
        return { success: false, error: 'Senha incorreta' };
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    console.log('🔐 [Auth] Logout:', user?.username);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}