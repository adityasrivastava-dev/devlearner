import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('devlearn_token'));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('devlearn_user')); }
    catch { return null; }
  });

  const saveAuth = useCallback((tokenVal, userData) => {
    localStorage.setItem('devlearn_token', tokenVal);
    localStorage.setItem('devlearn_user',  JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    localStorage.removeItem('devlearn_token');
    localStorage.removeItem('devlearn_user');
    setToken(null);
    setUser(null);
  }, []);

  // Sync token on app load — picks up role changes without re-login
  useEffect(() => {
    if (!token) return;
    authApi.refresh()
      .then((data) => {
        saveAuth(data.token, {
          id:     data.id,
          name:   data.name,
          email:  data.email,
          role:   data.role,
          roles:  data.roles || [],
          avatar: data.avatar || '',
          streak: data.streakDays     ?? 0,
          solved: data.problemsSolved ?? 0,
        });
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // Token expired — interceptor already cleared localStorage,
          // clear React state too so GuestRoute stops redirecting to /
          setToken(null);
          setUser(null);
        }
        // Network error (backend cold-starting) — keep current token and wait
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoggedIn = !!token && !!user;
  const isAdmin    = user?.role === 'ADMIN' || user?.roles?.includes('ADMIN');

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, isAdmin, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
