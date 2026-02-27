import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/theme';
import { storage } from '../utils/storage';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await storage.getTheme();
      if (saved) {
        setThemeMode(saved);
        setIsDark(saved === 'dark' || (saved === 'system' && systemScheme === 'dark'));
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemScheme === 'dark');
    }
  }, [systemScheme, themeMode]);

  const toggleTheme = async (mode) => {
    const newMode = mode || (isDark ? 'light' : 'dark');
    setThemeMode(newMode);
    setIsDark(newMode === 'dark' || (newMode === 'system' && systemScheme === 'dark'));
    await storage.setTheme(newMode);
  };

  const colors = {
    background: isDark ? COLORS.dark.background : COLORS.background,
    surface: isDark ? COLORS.dark.surface : COLORS.surface,
    surfaceAlt: isDark ? COLORS.dark.surfaceAlt : COLORS.surfaceAlt,
    border: isDark ? COLORS.dark.border : COLORS.border,
    divider: isDark ? COLORS.dark.divider : COLORS.divider,
    textPrimary: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
    textSecondary: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary,
    textTertiary: isDark ? COLORS.dark.textTertiary : COLORS.textTertiary,
    // Shared across both
    primary: COLORS.primary,
    primaryLight: COLORS.primaryLight,
    income: COLORS.income,
    incomeLight: isDark ? 'rgba(0,200,150,0.15)' : COLORS.incomeLight,
    expense: COLORS.expense,
    expenseLight: isDark ? 'rgba(255,107,107,0.15)' : COLORS.expenseLight,
    warning: COLORS.warning,
    warningLight: isDark ? 'rgba(255,176,32,0.15)' : COLORS.warningLight,
    textInverse: COLORS.textInverse,
    chartColors: COLORS.chartColors,
  };

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export default ThemeContext;
