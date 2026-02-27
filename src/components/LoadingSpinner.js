import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});

export default LoadingSpinner;
