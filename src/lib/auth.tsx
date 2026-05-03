import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const AUTH_SESSION_KEY = 'masbah.authenticated';

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const credentials = {
  username: import.meta.env.VITE_APP_USERNAME ?? 'admin',
  password: import.meta.env.VITE_APP_PASSWORD ?? 'admin123',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_SESSION_KEY) === 'true');

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    login(username, password) {
      const ok = username.trim() === credentials.username && password === credentials.password;
      if (ok) {
        localStorage.setItem(AUTH_SESSION_KEY, 'true');
        setIsAuthenticated(true);
      }
      return ok;
    },
    logout() {
      localStorage.removeItem(AUTH_SESSION_KEY);
      setIsAuthenticated(false);
    },
  }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
