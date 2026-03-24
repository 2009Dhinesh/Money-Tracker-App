import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZES } from '../constants/theme';
import Button from './Button';

const { width } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  buttons = [],
  type = 'default', // 'default', 'success', 'warning', 'error'
}) => {
  const { colors, isDark } = useTheme();
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible && animation._value === 0) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: COLORS.income };
      case 'warning': return { name: 'warning', color: COLORS.warning };
      case 'error': return { name: 'alert-circle', color: COLORS.expense };
      default: return { name: 'information-circle', color: COLORS.primary };
    }
  };

  const icon = getIcon();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: animation,
            },
            SHADOWS.md,
          ]}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
              <Ionicons name={icon.name} size={32} color={icon.color} />
            </View>
            
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {message && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            )}
          </View>

          <View style={[styles.buttonContainer, buttons.length > 2 && { flexDirection: 'column' }]}>
            {buttons.length > 0 ? (
              buttons.map((btn, index) => (
                <View 
                  key={index} 
                  style={buttons.length > 2 ? { width: '100%' } : { flex: 1 }}
                >
                  <Button
                    title={btn.text}
                    onPress={async () => {
                      onClose();
                      if (btn.onPress) {
                        try {
                          await btn.onPress();
                        } catch (err) {
                          console.error('Alert button action failed:', err);
                        }
                      }
                    }}
                    variant={btn.style === 'cancel' ? 'outline' : (btn.style === 'destructive' ? 'outline' : 'primary')}
                    style={[
                      styles.button,
                      btn.style === 'destructive' && { borderColor: COLORS.expense },
                      { paddingHorizontal: 8 } // Reduce padding to fit longer text like "Disconnect"
                    ]}
                    textStyle={[
                      btn.style === 'destructive' && { color: COLORS.expense },
                      { fontSize: 13 } // Slightly smaller font for alert buttons
                    ]}
                  />
                </View>
              ))
            ) : (
              <Button title="OK" onPress={onClose} style={{ width: '100%' }} />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    padding: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  button: {
    minHeight: 48,
  },
});

export default CustomAlert;
