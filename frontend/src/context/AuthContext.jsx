import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('aether_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('aether_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync token & user to localStorage
  const saveAuthSession = (userData, tokenString) => {
    if (tokenString) {
      localStorage.setItem('aether_token', tokenString);
      setToken(tokenString);
    }
    if (userData) {
      localStorage.setItem('aether_user', JSON.stringify(userData));
      setUser(userData);
    }
    setAuthError(null);
  };

  const clearAuthSession = () => {
    localStorage.removeItem('aether_token');
    localStorage.removeItem('aether_user');
    setToken(null);
    setUser(null);
  };

  // Verify auth session on initial load
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('aether_token');
    if (!storedToken) {
      clearAuthSession();
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('aether_user', JSON.stringify(res.data.user));
      } else {
        clearAuthSession();
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      clearAuthSession();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await authApi.login({ email, password });
      const { user: loggedInUser, token: authToken } = res.data;
      saveAuthSession(loggedInUser, authToken);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Register handler
  const register = async (payload) => {
    setAuthError(null);
    try {
      const res = await authApi.register(payload);
      const { user: registeredUser, token: authToken } = res.data;
      saveAuthSession(registeredUser, authToken);
      return { success: true, user: registeredUser };
    } catch (err) {
      const errMsg = err.message || 'Registration failed. Please try again.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      clearAuthSession();
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const res = await authApi.updateProfile(updates);
      const updatedUser = res?.data?.user || res?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('aether_user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, error: 'No user data returned' };
    } catch (err) {
      return { success: false, error: err.message || 'Profile update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateProfile,
        setUser,
        clearAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
