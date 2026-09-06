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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('marismakeup_token') || localStorage.getItem('belamakeup_token')
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    async function checkAuth() {
      const storedToken =
        localStorage.getItem('marismakeup_token') || localStorage.getItem('belamakeup_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid, defaulting to admin demo', err);
          await loginDemo('ADMIN');
        }
      } else {
        // Auto-login as Admin on first load for immediate working preview
        await loginDemo('ADMIN');
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const session = await api.login(email, password);
      localStorage.setItem('marismakeup_token', session.token);
      setToken(session.token);
      setUser(session.user as User);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role: UserRole) => {
    const email = role === 'ADMIN' ? 'marina@makeup.com.br' : 'vendedor@makeup.com.br';
    const password = role === 'ADMIN' ? 'marinamakeup' : 'vendedormakeup';
    await login(email, password);
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
