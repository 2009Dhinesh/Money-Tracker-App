import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function PinPad({ onKeyPress, onDelete, onBiometric, showBiometric = false }) {
  const { colors } = useTheme();
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((num) => (
            <TouchableOpacity 
              key={num} 
              style={[styles.button, { backgroundColor: colors.surfaceAlt }]} 
              onPress={() => onKeyPress(num.toString())}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        {showBiometric ? (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: `${COLORS.primary}18` }]} 
            onPress={onBiometric}
          >
            <Ionicons name="finger-print" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonPlaceholder} />
        )}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surfaceAlt }]} 
          onPress={() => onKeyPress('0')}
        >
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surfaceAlt }]} 
          onPress={onDelete}
        >
          <Ionicons name="backspace-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPlaceholder: {
    width: 72,
    height: 72,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '500',
  },
});
