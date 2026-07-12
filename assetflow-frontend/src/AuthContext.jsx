import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuthState = localStorage.getItem('authState');
    if (storedAuthState) {
      try {
        const authState = JSON.parse(storedAuthState);
        setToken(authState.token);
        setUser({
          userId: authState.userId,
          name: authState.name,
          email: authState.email,
          role: authState.role,
        });
      } catch (e) {
        console.error('Failed to parse auth state:', e);
      }
    }
    setLoading(false);
  }, []);

  function login(tokenValue, userValue) {
    const authState = {
      token: tokenValue,
      userId: userValue.userId,
      name: userValue.name,
      email: userValue.email,
      role: userValue.role,
    };
    localStorage.setItem('authState', JSON.stringify(authState));
    setToken(tokenValue);
    setUser(userValue);
  }

  function logout() {
    localStorage.removeItem('authState');
    setToken(null);
    setUser(null);
  }

  const isAdmin = user?.role === 'ADMIN';
  const isAssetManager = user?.role === 'ASSET_MANAGER';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isAssetManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
