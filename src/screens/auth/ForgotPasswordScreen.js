import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import authApi from '../../api/authApi';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../constants/theme';

const { height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { alert: showAlert } = useAlert();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1: Email, 2: Reset
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Invalid email address' });
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setStep(2);
      showAlert('Success', 'OTP has been sent to your email.', [], 'success');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors = {};
    if (!otp) newErrors.otp = 'OTP is required';
    if (!newPassword) newErrors.newPassword = 'New password is required';
    else if (newPassword.length < 6) newErrors.newPassword = 'Minimum 6 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp,
        newPassword
      });
      showAlert('Success', 'Password reset successful. Please login with your new password.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ], 'success');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#1A1044', '#3D2B8E', '#6C63FF']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="lock-open-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.appName}>Reset Password</Text>
            <Text style={styles.tagline}>
              {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {apiError ? (
            <View style={styles.apiErrorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <Input
                label="Email Address"
                value={email}
                onChangeText={(val) => { setEmail(val); setErrors({}); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
                error={errors.email}
              />
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
                style={styles.actionBtn}
              />
            </>
          ) : (
            <>
              <Input
                label="OTP"
                value={otp}
                onChangeText={(val) => { setOtp(val); setErrors({}); }}
                placeholder="Enter 4-digit OTP"
                keyboardType="number-pad"
                icon="key-outline"
                error={errors.otp}
              />
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={(val) => { setNewPassword(val); setErrors({}); }}
                placeholder="Minimum 6 characters"
                secureTextEntry
                icon="lock-closed-outline"
                error={errors.newPassword}
              />
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(val) => { setConfirmPassword(val); setErrors({}); }}
                placeholder="Repeat new password"
                secureTextEntry
                icon="checkmark-done-outline"
                error={errors.confirmPassword}
              />
              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.actionBtn}
              />
              <TouchableOpacity 
                style={styles.resendWrap}
                onPress={handleSendOTP}
                disabled={loading}
              >
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                  Didn't receive OTP? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              Remembered your password? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: height * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -30,
  },
  logoWrap: { alignItems: 'center', paddingHorizontal: 40 },
  logoIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  tagline: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.expenseLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  apiErrorText: {
    color: COLORS.expense,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    flex: 1,
  },
  actionBtn: { marginTop: SPACING.md },
  resendWrap: { marginTop: SPACING.xl, alignItems: 'center' },
  resendText: { fontSize: FONT_SIZES.sm },
  backToLogin: { marginTop: SPACING['2xl'], alignItems: 'center' },
  backText: { fontSize: FONT_SIZES.sm },
});

export default ForgotPasswordScreen;
