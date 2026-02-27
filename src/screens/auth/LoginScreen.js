import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../constants/theme';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setApiError(err.message || 'Login failed. Please try again.');
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
        {/* Header Gradient */}
        <LinearGradient
          colors={['#1A1044', '#3D2B8E', '#6C63FF']}
          style={styles.header}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="wallet" size={32} color="#fff" />
            </View>
            <Text style={styles.appName}>Money Tracker</Text>
            <Text style={styles.tagline}>Your smart finance companion</Text>
          </View>
        </LinearGradient>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back 👋</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to manage your finances
          </Text>

          {apiError ? (
            <View style={styles.apiErrorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

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
            placeholder="Enter your password"
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={[styles.forgot, { color: COLORS.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: COLORS.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: height * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
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
  logoWrap: { alignItems: 'center' },
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
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.xl,
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
  forgotWrap: { alignSelf: 'flex-end', marginTop: -SPACING.sm, marginBottom: SPACING.base },
  forgot: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  loginBtn: { marginTop: SPACING.xs },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: SPACING.md,
  },
  line: { flex: 1, height: 1 },
  orText: { fontSize: FONT_SIZES.sm },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: FONT_SIZES.base },
  registerLink: { fontSize: FONT_SIZES.base, fontWeight: '700' },
});

export default LoginScreen;
