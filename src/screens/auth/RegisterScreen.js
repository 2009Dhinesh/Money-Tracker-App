import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    else if (name.trim().length < 2) e.name = 'Name too short';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
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
        {/* Compact Header */}
        <LinearGradient
          colors={['#1A1044', '#3D2B8E', '#6C63FF']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Start tracking your money today</Text>
        </LinearGradient>

        {/* Form */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {apiError ? (
            <View style={styles.apiErrorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            icon="person-outline"
            error={errors.name}
          />
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureTextEntry
            icon="shield-checkmark-outline"
            error={errors.confirmPassword}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: SPACING.sm }}
          />

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: COLORS.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: SPACING.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  headerTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: FONT_SIZES.base,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
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
  apiErrorText: { color: COLORS.expense, fontSize: FONT_SIZES.sm, fontWeight: '500', flex: 1 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  loginText: { fontSize: FONT_SIZES.base },
  loginLink: { fontSize: FONT_SIZES.base, fontWeight: '700' },
});

export default RegisterScreen;
