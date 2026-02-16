import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const profileUser = response.data;

      // Client app is customer-only. If an admin token exists here, clear it.
      if (profileUser?.role === 'admin') {
        localStorage.removeItem('token');
        setUser(null);
        return;
      }

      setUser(profileUser);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { user, token } = response.data;

    if (user?.role === 'admin') {
      localStorage.removeItem('token');
      setUser(null);
      throw new Error('Admin account detected. Please login from the admin panel.');
    }

    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const register = async (data: { name: string; email: string; password: string; phone: string }) => {
    const response = await authAPI.register(data);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    const response = await authAPI.updateProfile(userData);
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
