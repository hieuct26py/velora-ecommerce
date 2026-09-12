/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, getAccessToken, setAccessToken } from '../api';

const AuthContext = createContext(null);

const storedUser = localStorage.getItem('velora_user');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [isBooting, setIsBooting] = useState(Boolean(getAccessToken()));

  useEffect(() => {
    if (!getAccessToken()) {
      return undefined;
    }

    authApi.refresh()
      .then(({ data }) => setAccessToken(data.accessToken))
      .catch(() => {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('velora_user');
      })
      .finally(() => setIsBooting(false));

    return undefined;
  }, []);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('velora_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('velora_user');
    }
  };

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    setAccessToken(data.accessToken);
    persistUser({ id: data.id, email: data.email, role: data.role });
    return data;
  };

  const register = async (credentials) => {
    const { data } = await authApi.register(credentials);
    await login(credentials);
    return data;
  };

  const logout = async () => {
    try {
      if (getAccessToken()) {
        await authApi.logout();
      }
    } finally {
      setAccessToken(null);
      persistUser(null);
    }
  };

  const updateUser = (nextUser) => {
    persistUser({ ...user, ...nextUser });
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user && getAccessToken()),
    isBooting,
    login,
    register,
    logout,
    updateUser,
  // Auth actions only use stable module APIs and state setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, isBooting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
