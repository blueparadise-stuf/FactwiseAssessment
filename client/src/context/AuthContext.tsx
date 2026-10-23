import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('arogyadesk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('arogyadesk_token') || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Revalidate session on initial mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('arogyadesk_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('arogyadesk_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // If session verification failed and token is expired/invalid
        setUser(null);
        setToken(null);
        localStorage.removeItem('arogyadesk_user');
        localStorage.removeItem('arogyadesk_token');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const loggedUser: User = res.data.user;
        const authToken: string = res.data.token;
        setUser(loggedUser);
        setToken(authToken);
        localStorage.setItem('arogyadesk_user', JSON.stringify(loggedUser));
        localStorage.setItem('arogyadesk_token', authToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API failed, continuing local teardown:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('arogyadesk_user');
      localStorage.removeItem('arogyadesk_token');
      window.location.href = '/login';
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
