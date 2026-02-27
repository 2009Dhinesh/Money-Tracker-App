import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

const KEYS = [
  ['C', '÷', '×', '⌫'],
  ['7', '8', '9', '-'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
  ['0', '00', '.', '='], // '=' spans two rows visually in styling
];

export default function NumericKeyboard({ visible, onClose, onConfirm, initialValue = '' }) {
  const { colors, isDark } = useTheme();
  
  // Expression stores the raw string like "500+200*2"
  const [expression, setExpression] = useState(initialValue?.toString() || '');
  
  // To handle the visual double-height equals button
  const [calculatedValue, setCalculatedValue] = useState('');

  // Safe math evaluation
  const evaluateExpression = (expr) => {
    try {
      // Replace display operators with JS operators
      const parseExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
      // Basic validation to prevent unsafe eval
      if (!/^[0-9+\-*/.\s]+$/.test(parseExpr)) return '';
      
      // We use a safe Function constructor instead of direct eval
      // It's safer than eval but still evaluates math.
      // Eslint might warn, but in this specific controlled regex case it's fine.
      // Alternatively, we could write a simple parser, but this works for basic +-*/
      const result = new Function('return ' + parseExpr)();
      
      if (isNaN(result) || !isFinite(result)) return '';
      
      // Format to max 2 decimal places if needed
      return Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
    } catch (err) {
      return '';
    }
  };

  const handleKeyPress = (key) => {
    if (key === 'C') {
      setExpression('');
      setCalculatedValue('');
      return;
    }

    if (key === '⌫') {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      return;
    }

    if (key === '=') {
      if (!expression) {
        onConfirm('0');
        onClose();
        return;
      }
      
      const result = evaluateExpression(expression);
      if (result) {
        setExpression(result);
        onConfirm(result);
        onClose();
      } else {
        // If it's just a number, confirm it
        if (!isNaN(parseFloat(expression))) {
          onConfirm(expression);
          onClose();
        }
      }
      return;
    }

    // Handle operators to prevent duplicates like "++"
    const isOperator = ['+', '-', '×', '÷'].includes(key);
    if (isOperator) {
      if (expression.length === 0 && key !== '-') return; // Only allow negative sign at start
      
      const lastChar = expression.slice(-1);
      if (['+', '-', '×', '÷', '.'].includes(lastChar)) {
        // Replace last operator
        setExpression(expression.slice(0, -1) + key);
        return;
      }
    }

    // Handle decimals
    if (key === '.') {
      // Check if current number already has a decimal
      const parts = expression.split(/[-+×÷]/);
      const currentNumber = parts[parts.length - 1];
      if (currentNumber.includes('.')) return;
    }

    // Add key to expression
    setExpression(prev => prev + key);
    
    // Auto-calculate preview if expression has operators
    if (['+', '-', '×', '÷'].some(op => (expression + key).includes(op))) {
      const preview = evaluateExpression(expression + key);
      if (preview && preview !== expression + key) {
        setCalculatedValue(preview);
      }
    } else {
      setCalculatedValue('');
    }
  };

  const getButtonStyle = (key) => {
    let baseStyle = [styles.key, { backgroundColor: colors.surfaceAlt }];
    let textStyle = [styles.keyText, { color: colors.textPrimary }];

    if (['÷', '×', '-', '+'].includes(key)) {
      textStyle.push({ color: COLORS.primary, fontSize: 24 });
    } else if (key === '=') {
      baseStyle.push({ backgroundColor: COLORS.primary });
      textStyle.push({ color: '#fff' });
    } else if (key === 'C' || key === '⌫') {
      textStyle.push({ color: COLORS.expense });
    }

    return { baseStyle, textStyle };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.keyboardContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
        >
          {/* Header / Display */}
          <View style={[styles.displayHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.previewText, { color: colors.textSecondary }]}>
              {calculatedValue ? `= ${calculatedValue}` : ' '}
            </Text>
            <View style={styles.expressionRow}>
              <Text 
                style={[styles.expressionText, { color: colors.textPrimary }]} 
                numberOfLines={1} 
                adjustsFontSizeToFit
              >
                {expression || '0'}
              </Text>
            </View>
          </View>

          {/* Keys Grid */}
          <View style={styles.keysGrid}>
            <View style={styles.mainKeys}>
              {/* Rows 1 to 4 (excluding the special last row layout) */}
              {KEYS.slice(0, 4).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.slice(0, 3).map((key) => {
                    const { baseStyle, textStyle } = getButtonStyle(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        style={baseStyle}
                        onPress={() => handleKeyPress(key)}
                      >
                        {key === '⌫' ? (
                           <Ionicons name="backspace-outline" size={24} color={COLORS.expense} />
                        ) : (
                          <Text style={textStyle}>{key}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              
              {/* Last Row (0, 00, .) */}
              <View style={styles.row}>
                {KEYS[4].slice(0, 3).map((key) => {
                  const { baseStyle, textStyle } = getButtonStyle(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={baseStyle}
                      onPress={() => handleKeyPress(key)}
                    >
                      <Text style={textStyle}>{key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Right Column (Operators & Equals) */}
            <View style={styles.rightColumn}>
              {['⌫', '-', '+'].map((key) => {
                const { baseStyle, textStyle } = getButtonStyle(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[baseStyle, { marginBottom: SPACING.sm }]}
                    onPress={() => handleKeyPress(key)}
                  >
                    {key === '⌫' ? (
                       <Ionicons name="backspace-outline" size={24} color={COLORS.expense} />
                    ) : (
                      <Text style={textStyle}>{key}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {/* Big Equals Button */}
              <TouchableOpacity
                style={[
                  styles.key, 
                  { backgroundColor: COLORS.primary, flex: 1, height: 'auto', marginTop: 0 }
                ]}
                onPress={() => handleKeyPress('=')}
              >
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>=</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  displayHeader: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
  },
  previewText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 4,
    height: 24,
  },
  expressionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expressionText: {
    fontSize: 40,
    fontWeight: '800',
  },
  keysGrid: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  mainKeys: {
    flex: 3,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  key: {
    flex: 1,
    aspectRatio: 1.2,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
  },
});
