import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setToken } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const { showToast } = useToast();

  const loadInitialState = useCallback(async () => {
    try {
      // 1. Fetch demo users for the reviewer persona switcher
      try {
        const demoRes = await authApi.getDemoUsers();
        if (demoRes.success) {
          setDemoUsers(demoRes.demoUsers);
        }
      } catch (e) {
        console.warn('Could not load demo users:', e.message);
      }

      // 2. Fetch authenticated user if token exists
      const token = localStorage.getItem('innovateverse_token');
      if (token) {
        try {
          const meRes = await authApi.getMe();
          if (meRes.success) {
            setUser(meRes.user);
          } else {
            setToken(null);
            setUser(null);
          }
        } catch {
          setToken(null);
          setUser(null);
        }
      } else {
        // If no user is logged in, default to Maya Lin (Student Innovator) for a frictionless initial demo!
        try {
          const mayaRes = await authApi.demoLogin('usr_maya_lin');
          if (mayaRes.success) {
            setToken(mayaRes.token);
            setUser(mayaRes.user);
          }
        } catch {
          // Offline fallback
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        showToast(`Welcome back, ${res.user.full_name}!`, 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        showToast(`Account registered successfully. Welcome, ${res.user.full_name}!`, 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    showToast('Signed out successfully.', 'info');
  };

  const switchDemoPersona = async (userId) => {
    try {
      const res = await authApi.demoLogin(userId);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        showToast(`Switched persona to: ${res.user.full_name} (${res.user.role})`, 'info');
        return true;
      }
    } catch (err) {
      showToast('Could not switch demo persona', 'error');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoUsers,
        login,
        register,
        logout,
        switchDemoPersona
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
