// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
  login: (accessToken: string, refreshToken: string, expiresAt: string | number, user: User) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string, expiresAt: string | number) => void;
  loading: boolean;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hàm helper để chuyển đổi expires_at
  const parseExpiresAt = (expiresAt: string | number): number => {
    if (typeof expiresAt === 'string') {
      return new Date(expiresAt).getTime();
    }
    return expiresAt;
  };

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedExpiresAt = localStorage.getItem('expires_at');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken && storedExpiresAt && storedUser) {
      const expiresAtNumber = parseInt(storedExpiresAt, 10);
      const userData = JSON.parse(storedUser);
      
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setExpiresAt(expiresAtNumber);
      setUser(userData);
      
      // Kiểm tra token có hết hạn không
      if (expiresAtNumber > Date.now()) {
        setIsAuthenticated(true);
      } else {
        // Token đã hết hạn, xóa dữ liệu
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (newAccessToken: string, newRefreshToken: string, newExpiresAt: string | number, userData: User) => {
    const expiresAtTimestamp = parseExpiresAt(newExpiresAt);
    
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    localStorage.setItem('expires_at', expiresAtTimestamp.toString());
    localStorage.setItem('user', JSON.stringify(userData));
    
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setExpiresAt(expiresAtTimestamp);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('user');
    
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateTokens = (newAccessToken: string, newRefreshToken: string, newExpiresAt: string | number) => {
    const expiresAtTimestamp = parseExpiresAt(newExpiresAt);
    
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    localStorage.setItem('expires_at', expiresAtTimestamp.toString());
    
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setExpiresAt(expiresAtTimestamp);
  };

  const isTokenExpired = (): boolean => {
    if (!expiresAt) return true;
    return expiresAt <= Date.now();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        expiresAt,
        user,
        login,
        logout,
        updateTokens,
        loading,
        isTokenExpired
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