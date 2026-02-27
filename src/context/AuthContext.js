import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [appPin, setAppPin] = useState(null);

  // Boot — restore session from secure storage
  useEffect(() => {
    const restore = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          storage.getToken(),
          storage.getUser(),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          setIsAuthenticated(true);
          
          // Pre-fetch biometric preference to avoid double loading screen
          const bioEnabled = await storage.getBiometricEnabled(savedUser._id);
          setIsBiometricEnabled(bioEnabled);
          
          const storedPin = await storage.getAppPin(savedUser._id);
          setAppPin(storedPin);
        }
      } catch (error) {
        console.warn('Session restore failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = res;
    await storage.setToken(newToken);
    await storage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);

    // Fetch biometric preference immediately on login
    const bioEnabled = await storage.getBiometricEnabled(newUser._id);
    setIsBiometricEnabled(bioEnabled);
    const storedPin = await storage.getAppPin(newUser._id);
    setAppPin(storedPin);

    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { token: newToken, user: newUser } = res;
    await storage.setToken(newToken);
    await storage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);

    // Fetch biometric preference immediately on register
    const bioEnabled = await storage.getBiometricEnabled(newUser._id);
    setIsBiometricEnabled(bioEnabled);
    const storedPin = await storage.getAppPin(newUser._id);
    setAppPin(storedPin);

    return res;
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAll();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsBiometricEnabled(false);
    setAppPin(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    const res = await authApi.updateProfile(updates);
    const updatedUser = res.user;
    await storage.setUser(updatedUser);
    setUser(updatedUser);
    return res;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      await storage.setUser(res.user);
      setUser(res.user);
    } catch (error) {
      console.warn('Failed to refresh user:', error);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return await authApi.changePassword({ currentPassword, newPassword });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return await authApi.forgotPassword({ email });
  }, []);

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    return await authApi.resetPassword({ email, otp, newPassword });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        changePassword,
        forgotPassword,
        resetPassword,
        isBiometricEnabled,
        setIsBiometricEnabled,
        appPin,
        setAppPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
