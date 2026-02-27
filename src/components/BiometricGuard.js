import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PinPad from './PinPad';

const BiometricGuard = ({ children }) => {
  const { user, isBiometricEnabled, appPin } = useAuth();
  const { colors, isDark } = useTheme();
  
  const hasSecurityEnabled = isBiometricEnabled || !!appPin;

  // status: 'checking' | 'unlocked' | 'locked'
  const [status, setStatus] = useState(hasSecurityEnabled ? 'checking' : 'unlocked');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (user && hasSecurityEnabled && status === 'checking') {
      if (isBiometricEnabled) {
        authenticateBiometric();
      } else {
        setStatus('locked');
      }
    }
  }, [user, hasSecurityEnabled, isBiometricEnabled]);

  const authenticateBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock SalaryCalc',
          fallbackLabel: 'Use PIN',
        });

        if (result.success) {
          setStatus('unlocked');
        } else {
          setStatus('locked');
        }
      } else {
        setStatus('locked');
      }
    } catch (error) {
      console.error('Biometric Auth Error:', error);
      setStatus('locked');
    }
  };

  const handlePinPress = (num) => {
    if (pinError) setPinError(false);
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      
      if (newPin.length === 4) {
        // verify
        if (newPin === appPin) {
          setStatus('unlocked');
          setPinInput('');
        } else {
          setPinError(true);
          setTimeout(() => {
            setPinInput('');
            setPinError(false);
          }, 500); // 500ms before clearing error
        }
      }
    }
  };

  const handleDelete = () => {
    if (pinError) setPinError(false);
    setPinInput((prev) => prev.slice(0, -1));
  };

  if (status === 'unlocked') {
    return children;
  }

  // If status is 'checking' or 'locked', show the Lock Screen design
  // (We don't show the generic LoadingSpinner here because the user prefers the Lock UI)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
          <Ionicons name="lock-closed" size={50} color={COLORS.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>App Locked</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Please authenticate to access your financial data
        </Text>

        {!!appPin ? (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {/* PIN Dots */}
            <View style={styles.pinDotsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View 
                  key={index} 
                  style={[
                    styles.pinDot, 
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    index < pinInput.length && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    pinError && { backgroundColor: COLORS.expense, borderColor: COLORS.expense }
                  ]} 
                />
              ))}
            </View>
            <PinPad 
              onKeyPress={handlePinPress} 
              onDelete={handleDelete} 
              showBiometric={isBiometricEnabled}
              onBiometric={authenticateBiometric}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: COLORS.primary }]} 
            onPress={authenticateBiometric}
          >
            <Ionicons name="finger-print" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Unlock App</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: SPACING.xl,
    width: '85%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING['xl'],
    lineHeight: 20,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING['3xl'],
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BiometricGuard;
