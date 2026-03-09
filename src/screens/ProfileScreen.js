import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Modal, TouchableWithoutFeedback, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import Button from '../components/Button';
import Input from '../components/Input';
import BADGES, { getAchievements } from '../utils/gamificationService';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { useAppDrawer } from '../context/DrawerContext';
import PinPad from '../components/PinPad';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser, setIsBiometricEnabled, appPin, setAppPin } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { summary, fetchSummary } = useTransactions();
  const { openDrawer } = useAppDrawer();

  const [activeTab, setActiveTab] = useState('account'); // 'account', 'security', 'preferences', 'badges'
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);

  useEffect(() => {
    fetchSummary();
    const checkBiometric = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometricHardware(hasHardware && isEnrolled);
      
      const enabled = await storage.getBiometricEnabled(user?._id);
      setBiometricEnabled(enabled);
      setIsBiometricEnabled(enabled);
    };
    checkBiometric();
  }, [user]);

  const handleBiometricToggle = async (value) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Biometrics',
      });
      if (result.success) {
        setBiometricEnabled(true);
        setIsBiometricEnabled(true);
        await storage.setBiometricEnabled(user?._id, true);
      }
    } else {
      setBiometricEnabled(false);
      setIsBiometricEnabled(false);
      await storage.setBiometricEnabled(user?._id, false);
    }
  };

  // App PIN States
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinMode, setPinMode] = useState('set'); // 'set', 'confirm', 'remove'
  const [tempPin, setTempPin] = useState('');
  const [pinInput, setPinInput] = useState('');

  const handlePinKeyPress = async (num) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);

      if (newPin.length === 4) {
        setTimeout(async () => {
          if (pinMode === 'set') {
            setTempPin(newPin);
            setPinInput('');
            setPinMode('confirm');
          } else if (pinMode === 'confirm') {
            if (newPin === tempPin) {
              await storage.setAppPin(user?._id, newPin);
              setAppPin(newPin);
              Alert.alert('Success', 'App PIN has been set successfully.');
              setPinModalVisible(false);
            } else {
              Alert.alert('Error', 'PINs do not match. Try again.');
              setPinInput('');
              setPinMode('set');
            }
          } else if (pinMode === 'remove') {
            if (newPin === appPin) {
              await storage.setAppPin(user?._id, null);
              setAppPin(null);
              Alert.alert('Success', 'App PIN has been removed.');
              setPinModalVisible(false);
            } else {
              Alert.alert('Error', 'Incorrect PIN.');
              setPinInput('');
            }
          }
        }, 100);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };
  
  // Password States
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [securityMode, setSecurityMode] = useState('change'); // 'change', 'forgot', 'otp'
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [emailForReset, setEmailForReset] = useState(user?.email || '');
  const [securityLoading, setSecurityLoading] = useState(false);

  const initials = user?.name
    ?.split(' ')
    ?.map((n) => n[0])
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2) || 'MT';

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateUser({
        name: name.trim(),
        currency,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
      });
      setEditing(false);
      Alert.alert('✅ Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const { changePassword, forgotPassword, resetPassword } = useAuth();

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (newPassword === oldPassword) {
      return Alert.alert('Error', 'New password must be different from old password');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }

    setSecurityLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('✅ Success', 'Password updated successfully');
      resetSecurityState();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!emailForReset) return Alert.alert('Error', 'Email is required');
    
    setSecurityLoading(true);
    try {
      await forgotPassword(emailForReset);
      Alert.alert('✅ Success', 'OTP sent to your email');
      setSecurityMode('otp');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyOTPAndReset = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (otp.length !== 4) {
      return Alert.alert('Error', 'Please enter 4-digit OTP');
    }

    setSecurityLoading(true);
    try {
      await resetPassword(emailForReset, otp, newPassword);
      Alert.alert('✅ Success', 'Password reset successful');
      resetSecurityState();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Invalid or expired OTP');
    } finally {
      setSecurityLoading(false);
    }
  };

  const resetSecurityState = () => {
    setSecurityModalVisible(false);
    setSecurityMode('change');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setSecurityLoading(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#1A1044', '#3D2B8E', '#6C63FF']}
          style={styles.headerGrad}
        >
          <View style={styles.topNav}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
              <Ionicons name="menu-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </LinearGradient>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          
          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
            {[
              { id: 'account', label: 'Account', icon: 'person-outline' },
              { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
              { id: 'preferences', label: 'Prefs', icon: 'settings-outline' },
              { id: 'badges', label: 'Badges', icon: 'trophy-outline' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  setActiveTab(tab.id);
                  setEditing(false);
                }}
                style={[
                  styles.tab,
                  activeTab === tab.id && { borderBottomColor: COLORS.primary, borderBottomWidth: 3 }
                ]}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={18} 
                  color={activeTab === tab.id ? COLORS.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? COLORS.primary : colors.textSecondary }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'account' && (
            <>
              {/* ── Edit Profile ────────────────── */}
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Profile Info</Text>
                  <TouchableOpacity onPress={() => setEditing((e) => !e)}>
                    <Text style={[styles.editToggle, { color: COLORS.primary }]}>
                      {editing ? 'Cancel' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {editing ? (
                  <>
                    <Input
                      label="Full Name"
                      value={name}
                      onChangeText={setName}
                      icon="person-outline"
                      placeholder="Your name"
                    />
                    <Input
                      label="Monthly Income (₹)"
                      value={monthlyIncome}
                      onChangeText={setMonthlyIncome}
                      keyboardType="numeric"
                      icon="cash-outline"
                      placeholder="e.g. 50000"
                    />
                    {/* Currency Picker */}
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Currency</Text>
                    <View style={styles.currencyRow}>
                      {CURRENCIES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.currencyChip,
                            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                            currency === c && { backgroundColor: `${COLORS.primary}18`, borderColor: COLORS.primary },
                          ]}
                          onPress={() => setCurrency(c)}
                        >
                          <Text style={[styles.currencyText, { color: currency === c ? COLORS.primary : colors.textSecondary }]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Button title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: SPACING.sm }} />
                  </>
                ) : (
                  <>
                    <ProfileRow icon="person-outline" label="Name" value={user?.name} colors={colors} />
                    <ProfileRow icon="mail-outline" label="Email" value={user?.email} colors={colors} />
                    <ProfileRow icon="cash-outline" label="Monthly Income" value={`₹${user?.monthlyIncome?.toLocaleString() || 0}`} colors={colors} />
                    <ProfileRow icon="pricetag-outline" label="Currency" value={user?.currency || 'INR'} colors={colors} />
                  </>
                )}
              </View>

              <Button
                title="Sign Out"
                onPress={handleLogout}
                variant="danger"
                icon={<Ionicons name="log-out-outline" size={18} color={COLORS.expense} />}
                style={{ marginTop: SPACING.md }}
              />
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              {/* ── Preferences ─────────────────── */}
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
                      <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={() => toggleTheme()}
                    trackColor={{ false: colors.border, true: COLORS.primaryLight }}
                    thumbColor={isDark ? COLORS.primary : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* ── Data Management ──────────────── */}
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Management</Text>
                
                <TouchableOpacity 
                  style={styles.settingRow}
                  onPress={() => navigation.navigate('Categories')}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
                      <Ionicons name="grid-outline" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Manage Categories</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingRow}
                  onPress={() => navigation.navigate('PaymentMethods')}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
                      <Ionicons name="card-outline" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Manage Payment Methods</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>App Info</Text>
                 <ProfileRow icon="information-circle-outline" label="Version" value="1.0.0" colors={colors} />
                 <ProfileRow icon="code-slash-outline" label="Built with" value="MERN Stack" colors={colors} />
              </View>
            </>
          )}

          {activeTab === 'badges' && (
            /* ── Achievements ─────────────────── */
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: SPACING.md }]}>Achievements</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, justifyContent: 'center' }}>
                {BADGES.map((badge) => (
                  <View 
                    key={badge.id} 
                    style={[
                      styles.badgeCard, 
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border, width: (width - SPACING.xl * 4) / 3 },
                      !getAchievements(user, summary).find(a => a.id === badge.id && a.isEarned) && { opacity: 0.3 }
                    ]}
                  >
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={[styles.badgeTitle, { color: colors.textPrimary }]} numberOfLines={1}>{badge.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'security' && (
            /* ── Security ────────────────────── */
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Security</Text>
              
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => { setSecurityMode('change'); setSecurityModalVisible(true); }}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
                    <Ionicons name="keypad-outline" size={18} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>App PIN</Text>
                </View>
                {appPin ? (
                  <TouchableOpacity onPress={() => { setPinMode('remove'); setPinInput(''); setPinModalVisible(true); }}>
                    <Text style={{ color: COLORS.expense, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => { setPinMode('set'); setPinInput(''); setPinModalVisible(true); }}>
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Set PIN</Text>
                  </TouchableOpacity>
                )}
              </View>

              {hasBiometricHardware && (
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
                      <Ionicons name="finger-print-outline" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Biometric Lock</Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.border, true: COLORS.primaryLight }}
                    thumbColor={biometricEnabled ? COLORS.primary : '#f4f3f4'}
                  />
                </View>
              )}
            </View>
          )}

          <View style={{ height: SPACING['4xl'] }} />
        </View>
      </ScrollView>

      {/* Security Modal (Change/Forgot/OTP) */}
      <Modal
        visible={securityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetSecurityState}
      >
        <TouchableWithoutFeedback onPress={resetSecurityState}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    {securityMode === 'change' && 'Change Password'}
                    {securityMode === 'forgot' && 'Forgot Password'}
                    {securityMode === 'otp' && 'Verify OTP'}
                  </Text>
                  <TouchableOpacity onPress={resetSecurityState}>
                    <Ionicons name="close" size={24} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {securityMode === 'change' && (
                    <>
                      <Input
                        label="Old Password"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        secureTextEntry
                        icon="lock-closed-outline"
                        placeholder="Current password"
                      />
                      <Input
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        icon="shield-checkmark-outline"
                        placeholder="Min 6 characters"
                      />
                      <Input
                        label="Re-enter New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        icon="shield-checkmark-outline"
                        placeholder="Confirm password"
                      />
                      <TouchableOpacity 
                        style={{ alignSelf: 'flex-end', marginBottom: SPACING.md }}
                        onPress={() => setSecurityMode('forgot')}
                      >
                        <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Forgot password?</Text>
                      </TouchableOpacity>
                      <Button 
                        title="Update Password" 
                        onPress={handlePasswordChange} 
                        loading={securityLoading} 
                      />
                    </>
                  )}

                  {securityMode === 'forgot' && (
                    <>
                      <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                        Enter your registered email to receive a 4-digit OTP.
                      </Text>
                      <Input
                        label="Email Address"
                        value={emailForReset}
                        onChangeText={setEmailForReset}
                        keyboardType="email-address"
                        icon="mail-outline"
                        placeholder="e.g. yourname@email.com"
                      />
                      <Button 
                        title="Send OTP" 
                        onPress={handleRequestOTP} 
                        loading={securityLoading} 
                        style={{ marginTop: SPACING.sm }}
                      />
                      <TouchableOpacity 
                        style={{ alignItems: 'center', marginTop: SPACING.lg }}
                        onPress={() => setSecurityMode('change')}
                      >
                        <Text style={{ color: colors.textSecondary }}>Back to Change Password</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {securityMode === 'otp' && (
                    <>
                      <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                        Enter the 4-digit code sent to {emailForReset.replace(/(.{3})(.*)(@.*)/, "$1***$3")}
                      </Text>
                      <Input
                        label="OTP Code"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={4}
                        icon="key-outline"
                        placeholder="4-digit code"
                      />
                      <Input
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        icon="shield-checkmark-outline"
                        placeholder="Min 6 characters"
                      />
                      <Input
                        label="Re-enter New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        icon="shield-checkmark-outline"
                        placeholder="Confirm password"
                      />
                      <Button 
                        title="Reset Password" 
                        onPress={handleVerifyOTPAndReset} 
                        loading={securityLoading} 
                        style={{ marginTop: SPACING.sm }}
                      />
                      <TouchableOpacity 
                        style={{ alignItems: 'center', marginTop: SPACING.lg }}
                        onPress={() => setSecurityMode('forgot')}
                      >
                        <Text style={{ color: colors.textSecondary }}>Didn't receive code? Resend</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* PIN Security Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: 40 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {pinMode === 'set' && 'Enter New 4-Digit PIN'}
                  {pinMode === 'confirm' && 'Confirm 4-Digit PIN'}
                  {pinMode === 'remove' && 'Enter Current PIN to Remove'}
                </Text>
                <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING['3xl'], marginTop: SPACING.xl }}>
                  {[0, 1, 2, 3].map((index) => (
                    <View 
                      key={index} 
                      style={[
                        { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        index < pinInput.length && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                      ]} 
                    />
                  ))}
                </View>
                <PinPad 
                  onKeyPress={handlePinKeyPress} 
                  onDelete={handlePinDelete} 
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

    </View>
  );
}

const { width } = Dimensions.get('window');

const ProfileRow = ({ icon, label, value, colors }) => (
  <View style={rowStyles.row}>
    <View style={[rowStyles.icon, { backgroundColor: colors.surfaceAlt }]}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
    </View>
    <View style={rowStyles.textWrap}>
      <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  icon: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  label: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginBottom: 2 },
  value: { fontSize: FONT_SIZES.base, fontWeight: '600' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: {
    paddingTop: 56, paddingBottom: SPACING['2xl'],
    alignItems: 'center', gap: SPACING.sm,
  },
  topNav: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    position: 'relative',
  },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: SPACING.md,
    padding: 2,
  },
  headerTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: FONT_SIZES['3xl'], fontWeight: '800', color: '#fff' },
  userName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  userEmail: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: SPACING.xl, paddingBottom: 100 },
  tabs: { flexDirection: 'row', marginBottom: SPACING.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, gap: 4 },
  tabText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  section: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: SPACING.base, marginBottom: SPACING.base,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  editToggle: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm },
  currencyRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  currencyChip: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, borderWidth: 1 },
  currencyText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: SPACING.xs,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  settingIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  badgeCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
  },
  badgeIcon: { fontSize: 32, marginBottom: 4 },
  badgeTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
});
