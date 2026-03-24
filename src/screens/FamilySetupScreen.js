import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  StatusBar, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useAccounts } from '../hooks/useAccounts';
import familyApi from '../api/familyApi';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

export default function FamilySetupScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { alert: showAlert } = useAlert();
  const { accounts, fetchAccounts, loading: accountsLoading } = useAccounts();
  
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [loading, setLoading] = useState(false);

  // Join/Search State
  const [inviteCode, setInviteCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  // Invite/Code State
  const [myFamilyCode, setMyFamilyCode] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchMyCode();
  }, []);

  const fetchMyCode = async () => {
    try {
      const res = await familyApi.getMyFamilyCode();
      if (res.success) setMyFamilyCode(res.familyCode);
    } catch (err) {
      console.error('Fetch my code error:', err);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    showAlert('Copied', 'Family code copied to clipboard!', [], 'success');
  };

  const handleSearch = async () => {
    if (!inviteCode.trim()) return showAlert('Required', 'Please enter a family code.', [], 'warning');
    
    try {
      setSearching(true);
      setSearchResult(null);
      const res = await familyApi.searchUserByCode(inviteCode.trim().toUpperCase());
      if (res.success) {
        setSearchResult(res.user);
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'User not found.', [], 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async () => {
    if (!searchResult) return;
    
    try {
      const res = await familyApi.connectMember(searchResult._id);
      showAlert('Request Sent!', res.message || `Connection request sent to ${searchResult.name}. They need to accept it to connect.`, [], 'success');
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.response?.data?.message || err.message, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (id) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  if (loading) return <LoadingSpinner message="Processing..." />;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Family Setup</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceAlt }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'join' && styles.activeTab]} 
            onPress={() => setActiveTab('join')}
          >
            <Text style={[styles.tabLabel, activeTab === 'join' && styles.activeTabLabel]}>Connect Member</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'create' && styles.activeTab]} 
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.tabLabel, activeTab === 'create' && styles.activeTabLabel]}>My Invite Code</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeTab === 'join' ? (
            <View style={styles.container}>
              <View style={styles.iconCircle}>
                <Ionicons name="search-outline" size={40} color={COLORS.primary} />
              </View>
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
                <TextInput
                  placeholder="Enter 8-digit code"
                  placeholderTextColor={colors.textTertiary}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  keyboardType="number-pad"
                  maxLength={8}
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                />
                <TouchableOpacity 
                  onPress={handleSearch} 
                  style={[styles.searchBtn, { backgroundColor: COLORS.primary }]}
                  disabled={searching || inviteCode.length < 8}
                  activeOpacity={1}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.searchBtnText}>FIND</Text>
                      <Ionicons name="chevron-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {searchResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.surfaceAlt, borderColor: COLORS.primary, borderWidth: 1.5 }]}>
                  <View style={[styles.resultHeader]}>
                    <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                      <Text style={[styles.avatarText, { color: '#fff' }]}>{searchResult.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACING.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.resultName, { color: colors.textPrimary }]}>{searchResult.name}</Text>
                        <View style={styles.foundBadge}>
                          <Ionicons name="checkmark-circle" size={12} color={COLORS.income} />
                          <Text style={styles.foundText}>MATCH FOUND</Text>
                        </View>
                      </View>
                      <Text style={[styles.resultEmail, { color: colors.textSecondary }]}>{searchResult.email}</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.resultFooter, { borderTopColor: colors.border }]}>
                    <Text style={[styles.resultHint, { color: colors.textTertiary }]}>
                      Connect to share accounts & track family expenses.
                    </Text>
                    <Button 
                      title="Send Connection Request" 
                      onPress={handleConnect} 
                      type="primary"
                      size="sm"
                      style={{ marginTop: SPACING.md }}
                    />
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.container}>
              <View style={styles.iconCircle}>
                <Ionicons name="share-social-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Your Invite Code</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Share this code with your family members so they can connect with you.
              </Text>

              <TouchableOpacity 
                style={[styles.codeDisplay, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={() => copyToClipboard(myFamilyCode)}
                activeOpacity={0.7}
              >
                <Text style={[styles.codeText, { color: COLORS.primary }]}>{myFamilyCode || '8888 8888'}</Text>
                <View style={[styles.copyBadge, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="copy" size={14} color="#fff" />
                  <Text style={styles.copyBadgeText}>TAP TO COPY</Text>
                </View>
              </TouchableOpacity>
              
              <Text style={[styles.hint, { color: colors.textTertiary, marginTop: SPACING.xl }]}>
                When someone connects with you, you will both be able to share account access with each other.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: SPACING.md, paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  headerIcon: { padding: 4 },
  tabBar: {
    flexDirection: 'row', margin: SPACING.xl, borderRadius: RADIUS.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.sm },
  activeTab: { backgroundColor: COLORS.primary, ...SHADOWS.sm },
  tabLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary },
  activeTabLabel: { color: '#fff' },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  container: { alignItems: 'center', paddingTop: SPACING.lg },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.sm, textAlign: 'center', marginBottom: SPACING.xl, paddingHorizontal: SPACING.xl },
  sectionTitle: { fontSize: 10, fontWeight: '800', alignSelf: 'flex-start', letterSpacing: 1 },
  accountIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accountName: { flex: 1, marginLeft: SPACING.md, fontSize: FONT_SIZES.base, fontWeight: '600' },
  searchContainer: { 
    flexDirection: 'row', width: '100%', alignItems: 'center', 
    height: 56, borderRadius: RADIUS.lg, borderWidth: 1, 
    paddingLeft: SPACING.md, paddingRight: 4, marginTop: SPACING.lg,
    ...SHADOWS.sm
  },
  searchIcon: { marginRight: SPACING.xs },
  searchInput: { flex: 1, fontSize: FONT_SIZES.base, fontWeight: '600' },
  searchBtn: { 
    height: 48, paddingHorizontal: SPACING.lg, 
    borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' 
  },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  resultCard: { 
    width: '100%', borderRadius: RADIUS.xl, marginTop: SPACING.xl,
    overflow: 'hidden', ...SHADOWS.md
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 22 },
  resultName: { fontSize: 16, fontWeight: '800' },
  resultEmail: { fontSize: 13, opacity: 0.6, marginTop: 2 },
  foundBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 4, backgroundColor: `${COLORS.income}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  foundText: { fontSize: 8, fontWeight: '900', color: COLORS.income, letterSpacing: 0.5 },
  resultFooter: { padding: SPACING.lg, borderTopWidth: 1, backgroundColor: 'rgba(0,0,0,0.02)' },
  resultHint: { fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  codeDisplay: { 
    paddingVertical: SPACING.xl * 1.5, borderRadius: RADIUS.xl, width: '100%', 
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    ...SHADOWS.md
  },
  codeText: { fontSize: 40, fontWeight: '900', letterSpacing: 8, marginBottom: SPACING.md },
  copyBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, ...SHADOWS.sm
  },
  copyBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 6 },
  hint: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' }
});
