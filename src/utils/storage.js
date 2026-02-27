import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const THEME_KEY = 'appTheme';
const NOTIF_PERMISSION_KEY = 'notificationPermissionStatus';
const BIOMETRIC_KEY = 'biometricEnabled';
const BRIEFING_KEY = 'lastBriefingShownDate';

export const storage = {
  // Token
  setToken: async (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  getToken: async () => SecureStore.getItemAsync(TOKEN_KEY),
  removeToken: async () => SecureStore.deleteItemAsync(TOKEN_KEY),

  // User
  setUser: async (user) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  getUser: async () => {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  removeUser: async () => SecureStore.deleteItemAsync(USER_KEY),

  // Theme
  setTheme: async (theme) => SecureStore.setItemAsync(THEME_KEY, theme),
  getTheme: async () => SecureStore.getItemAsync(THEME_KEY),

  // Notification Permission
  setNotifPermission: async (status) => AsyncStorage.setItem(NOTIF_PERMISSION_KEY, status),
  getNotifPermission: async () => AsyncStorage.getItem(NOTIF_PERMISSION_KEY),

  // Biometrics - User specific
  setBiometricEnabled: async (userId, enabled) => {
    if (!userId) return;
    await AsyncStorage.setItem(`${BIOMETRIC_KEY}_${userId}`, enabled.toString());
  },
  getBiometricEnabled: async (userId) => {
    if (!userId) return false;
    const val = await AsyncStorage.getItem(`${BIOMETRIC_KEY}_${userId}`);
    return val === 'true';
  },

  // App PIN - User specific (Store in SecureStore for security)
  setAppPin: async (userId, pin) => {
    if (!userId) return;
    try {
      if (pin) {
        await SecureStore.setItemAsync(`appPin_${userId}`, pin);
      } else {
        await SecureStore.deleteItemAsync(`appPin_${userId}`);
      }
    } catch (e) {
      console.warn("Failed to set app pin", e);
    }
  },
  getAppPin: async (userId) => {
    if (!userId) return null;
    try {
      return await SecureStore.getItemAsync(`appPin_${userId}`);
    } catch (e) {
      return null;
    }
  },

  // Daily Briefing - User specific
  setLastBriefing: async (userId, date) => {
    if (!userId) return;
    await AsyncStorage.setItem(`${BRIEFING_KEY}_${userId}`, date);
  },
  getLastBriefing: async (userId) => {
    if (!userId) return null;
    return AsyncStorage.getItem(`${BRIEFING_KEY}_${userId}`);
  },

  // Clear all
  clearAll: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};

export default storage;
