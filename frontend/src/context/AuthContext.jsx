import { createContext, useContext, useEffect, useState } from 'react';
import {
  authService,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authService.getMe();
        setUser(data);
      } catch {
        clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleAuthSuccess = (data) => {
    setStoredToken(data.token);
    setUser({
      id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
    });
    return data;
  };

  const registerUser = async (formData) => {
    const { data } = await authService.registerUser(formData);
    return handleAuthSuccess(data);
  };

  const registerDermatologist = async (formData) => {
    const { data } = await authService.registerDermatologist(formData);
    return handleAuthSuccess(data);
  };

  const loginUser = async (formData) => {
    const { data } = await authService.loginUser(formData);
    return handleAuthSuccess(data);
  };

  const loginDermatologist = async (formData) => {
    const { data } = await authService.loginDermatologist(formData);
    return handleAuthSuccess(data);
  };

  const loginWithGoogle = async (payload) => {
    const { data } = await authService.loginWithGoogle(payload);
    return handleAuthSuccess(data);
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        registerUser,
        registerDermatologist,
        loginUser,
        loginDermatologist,
        loginWithGoogle,
        logout,
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
