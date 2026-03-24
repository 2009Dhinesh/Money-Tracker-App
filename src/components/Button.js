import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING, FONT_SIZES, SHADOWS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',   // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',           // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, fontSize: FONT_SIZES.sm },
    md: { paddingVertical: SPACING.md + 2, paddingHorizontal: SPACING.xl, fontSize: FONT_SIZES.base },
    lg: { paddingVertical: SPACING.base + 2, paddingHorizontal: SPACING['2xl'], fontSize: FONT_SIZES.lg },
  };

  const s = sizeStyles[size] || sizeStyles.md;

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={isDisabled ? ['#B0AEE8', '#C4C2F0'] : COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { paddingVertical: s.paddingVertical }, SHADOWS.md]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.row}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text
                numberOfLines={1}
                style={[styles.primaryText, { fontSize: s.fontSize }, textStyle]}
              >
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    secondary: {
      bg: colors.surfaceAlt,
      text: colors.textPrimary,
      border: colors.border,
    },
    outline: {
      bg: 'transparent',
      text: COLORS.primary,
      border: COLORS.primary,
    },
    danger: {
      bg: COLORS.expenseLight,
      text: COLORS.expense,
      border: COLORS.expense,
    },
    ghost: {
      bg: 'transparent',
      text: colors.textSecondary,
      border: 'transparent',
    },
  };

  const vs = variantStyles[variant] || variantStyles.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
          borderWidth: variant === 'outline' ? 1.5 : 1,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            numberOfLines={1}
            style={[
              styles.text,
              { color: vs.text, fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default Button;
