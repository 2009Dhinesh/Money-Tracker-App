import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZES } from '../constants/theme';

const { width } = Dimensions.get('window');

const Snackbar = ({
  visible,
  message,
  actionText,
  onAction,
  duration = 5000,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      // Progress animation
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false, // width/flex doesn't support native driver
      }).start();

      // Auto dismiss timer
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      // Hide animation
      handleHide();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };

  const handleAction = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (onAction) onAction();
  };

  if (!visible && fadeAnim._value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.content, SHADOWS.lg]}>
        <View style={styles.row}>
          <Text style={styles.message}>{message}</Text>
          {actionText && (
            <TouchableOpacity onPress={handleAction} style={styles.actionBtn}>
              <Text style={styles.actionText}>{actionText}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]} 
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#323232',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    paddingTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  message: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    flex: 1,
  },
  actionBtn: {
    marginLeft: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionText: {
    color: COLORS.primaryLight,
    fontWeight: '800',
    fontSize: FONT_SIZES.md,
    textTransform: 'uppercase',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});

export default Snackbar;
