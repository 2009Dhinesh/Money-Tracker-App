import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import authApi from '../api/authApi';
import { setUnauthorizedHandler } from '../api/axios';
import { AppState } from 'react-native';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [appPin, setAppPin] = useState(null);

  // Helper to decode JWT payload safely in React Native
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if missing (JWT payloads often omit it)
      const missingPadding = (4 - (payloadBase64.length % 4)) % 4;
      payloadBase64 += '='.repeat(missingPadding);

      // Simple base64 decode for React Native environments where atob might be missing
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let binary = '';
      const len = payloadBase64.length;
      
      for (let i = 0; i < len; i += 4) {
        const char1 = base64Chars.indexOf(payloadBase64[i]);
        const char2 = base64Chars.indexOf(payloadBase64[i + 1]);
        const char3 = base64Chars.indexOf(payloadBase64[i + 2]);
        const char4 = base64Chars.indexOf(payloadBase64[i + 3]);
        
        const bytes1 = (char1 << 2) | (char2 >> 4);
        const bytes2 = ((char2 & 15) << 4) | (char3 >> 2);
        const bytes3 = ((char3 & 3) << 6) | char4;
        
        binary += String.fromCharCode(bytes1);
        if (payloadBase64[i + 2] !== '=') binary += String.fromCharCode(bytes2);
        if (payloadBase64[i + 3] !== '=') binary += String.fromCharCode(bytes3);
      }
      
      const payload = JSON.parse(binary);
      const now = Math.floor(Date.now() / 1000);
      
      // Add 5 minute (300s) buffer to account for clock skew
      return payload.exp < (now + 300);
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return true;
    }
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAll();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsBiometricEnabled(false);
    setAppPin(null);
  }, []);

  // Boot — restore session from secure storage
  useEffect(() => {
    const restore = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          storage.getToken(),
          storage.getUser(),
        ]);
        
        if (savedToken && savedUser) {
          // Check if token is expired on boot
          if (isTokenExpired(savedToken)) {
            console.log('Token expired on boot, logging out');
            await logout();
            return;
          }

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

    // Register 401 handler
    setUnauthorizedHandler(() => {
      console.log('Unauthorized event captured, logging out');
      logout();
    });

    // AppState listener to check expiration when app returning to foreground
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const currentToken = await storage.getToken();
        if (currentToken && isTokenExpired(currentToken)) {
          console.log('Token expired while in background, logging out');
          await logout();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [logout, isTokenExpired]);

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
