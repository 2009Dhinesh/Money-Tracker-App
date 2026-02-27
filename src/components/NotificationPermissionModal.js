import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const NotificationPermissionModal = ({ isVisible, onAllow, onDeny, onClose }) => {
  const { colors, isDark } = useTheme();

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
            <Ionicons name="notifications" size={40} color={COLORS.primary} />
          </View>

          {/* Content */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>Enable Notifications</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Allow notifications to get budget alerts, reminders, and important updates.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.allowButton]} 
              onPress={onAllow}
              activeOpacity={0.8}
            >
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceAlt }]} 
              onPress={onDeny}
              activeOpacity={0.8}
            >
              <Text style={[styles.denyButtonText, { color: colors.textSecondary }]}>Don't Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: width * 0.85,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
    elevation: 5,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginBottom: SPACING.base,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.sm,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButton: {
    backgroundColor: COLORS.primary,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  denyButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});

export default NotificationPermissionModal;
