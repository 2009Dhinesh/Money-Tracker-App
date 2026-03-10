import React, { forwardRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING, FONT_SIZES } from '../constants/theme';

const Input = forwardRef(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      error,
      secureTextEntry,
      keyboardType,
      icon,
      rightIcon,
      onRightIconPress,
      multiline,
      numberOfLines,
      editable = true,
      style,
      inputStyle,
      ...rest
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const borderColor = error
      ? COLORS.expense
      : isFocused
      ? COLORS.primary
      : colors.border;

    return (
      <View style={[styles.wrapper, style]}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        )}
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor,
              borderWidth: isFocused || error ? 1.5 : 1,
            },
            multiline && { height: numberOfLines ? numberOfLines * 44 : 100, alignItems: 'flex-start' },
          ]}
        >
          {icon && (
            <View style={styles.leftIcon}>
              <Ionicons name={icon} size={18} color={isFocused ? COLORS.primary : colors.textTertiary} />
            </View>
          )}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType || 'default'}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={editable}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                flex: 1,
                textAlignVertical: multiline ? 'top' : 'center',
                paddingTop: multiline ? SPACING.md : 0,
              },
              inputStyle,
            ]}
            {...rest}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
              style={styles.rightIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
          {rightIcon && !secureTextEntry && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons name={rightIcon} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color={COLORS.expense} />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs + 2,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  leftIcon: {
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '400',
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    paddingHorizontal: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  error: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.expense,
    fontWeight: '500',
  },
});

export default Input;
