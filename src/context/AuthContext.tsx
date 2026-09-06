import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isVendedor: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, { token: string; user: User; email: string; password: string }> = {
  ADMIN: {
    token: 'token_admin_demo',
    email: 'marina@makeup.com.br',
    password: 'marinamakeup',
    user: {
      id: 'usr_admin',
      name: 'Marina (Administradora)',
      email: 'marina@makeup.com.br',
      role: 'ADMIN',
      active: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: '(11) 98765-4321',
      createdAt: '2026-01-01',
    },
  },
  VENDEDOR: {
    token: 'token_vendedor_demo',
    email: 'vendedor@makeup.com.br',
    password: 'vendedormakeup',
    user: {
      id: 'usr_vendedor_1',
      name: 'Vendedora MARIS',
      email: 'vendedor@makeup.com.br',
      role: 'VENDEDOR',
      active: true,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: '(11) 97654-3210',
      createdAt: '2026-01-01',
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('marismakeup_token') || localStorage.getItem('belamakeup_token')
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken =
        localStorage.getItem('marismakeup_token') || localStorage.getItem('belamakeup_token');

      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('API de sessão indisponível; restaurando sessão demo local.', err);
          const demo = Object.values(DEMO_USERS).find((item) => item.token === storedToken);
          if (demo) {
            setToken(demo.token);
            setUser(demo.user);
          } else {
            localStorage.removeItem('marismakeup_token');
            localStorage.removeItem('belamakeup_token');
          }
        }
      } else {
        // Primeiro acesso: abre diretamente como administrador demo.
        const demo = DEMO_USERS.ADMIN;
        localStorage.setItem('marismakeup_token', demo.token);
        setToken(demo.token);
        setUser(demo.user);
      }

      setLoading(false);
    }

    checkAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      // Credenciais demo continuam funcionando mesmo se a função API estiver indisponível.
      const normalizedEmail = email.trim().toLowerCase();
      const demo = Object.values(DEMO_USERS).find(
        (item) => item.email === normalizedEmail && item.password === password
      );

      if (demo) {
        localStorage.setItem('marismakeup_token', demo.token);
        localStorage.removeItem('belamakeup_token');
        setToken(demo.token);
        setUser(demo.user);
        return;
      }

      const session = await api.login(email, password);
      localStorage.setItem('marismakeup_token', session.token);
      localStorage.removeItem('belamakeup_token');
      setToken(session.token);
      setUser(session.user as User);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role: UserRole) => {
    const demo = DEMO_USERS[role];
    if (!demo) return;
    localStorage.setItem('marismakeup_token', demo.token);
    localStorage.removeItem('belamakeup_token');
    setToken(demo.token);
    setUser(demo.user);
  };

  const logout = () => {
    localStorage.removeItem('marismakeup_token');
    localStorage.removeItem('belamakeup_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isVendedor = user?.role === 'VENDEDOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isVendedor,
        login,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
