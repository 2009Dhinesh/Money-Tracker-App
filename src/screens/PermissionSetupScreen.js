import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  StatusBar, Switch, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../context/AuthContext';
import familyApi from '../api/familyApi';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

export default function PermissionSetupScreen({ navigation, route }) {
  const { member } = route.params;
  const { colors, isDark } = useTheme();
  const { alert: showAlert } = useAlert();
  const { user } = useAuth();
  const { accounts, fetchAccounts, loading: accountsLoading } = useAccounts();

  // Filter accounts to only show those owned by the current user
  const personalAccounts = (accounts || []).filter(acc => {
    const ownerId = acc.user?._id || acc.user;
    return ownerId === user?._id;
  });

  const [accessType, setAccessType] = useState(member.permissions?.accessType || 'custom'); // 'all', 'custom', 'none'
  const [permissions, setPermissions] = useState(member.permissions?.accounts || []); // [{ accountId, canView, canEdit }]
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (personalAccounts.length > 0 && permissions.length === 0) {
      setPermissions(personalAccounts.map(acc => ({
        accountId: acc._id,
        canView: true,
        canEdit: false
      })));
    }
  }, [personalAccounts]);

  const togglePermission = (accountId, field) => {
    setPermissions(prev => prev.map(p => {
      const pId = p.accountId?._id || p.accountId;
      return pId === accountId ? { ...p, [field]: !p[field] } : p;
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Requirement 4: Store permissions like { accessType: "all" or "custom", accounts: [...] }
      await familyApi.updatePermissions(member._id, accessType, permissions);
      showAlert('Success', 'Permissions saved successfully!', [], 'success');
      navigation.navigate('FamilyMembers');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || err.message, [], 'error');
    } finally {
      setSaving(false);
    }
  };

  if (accountsLoading || saving) return <LoadingSpinner message={saving ? "Saving..." : "Loading accounts..."} />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Permissions</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.memberInfo}>
          <View style={[styles.avatar, { backgroundColor: `${COLORS.primary}15` }]}>
            <Text style={[styles.avatarText, { color: COLORS.primary }]}>{member.name.charAt(0)}</Text>
          </View>
          <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
          <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCESS LEVEL</Text>
        
        {/* Radio Options */}
        <TouchableOpacity 
          style={[styles.radioRow, { backgroundColor: colors.surface }]} 
          onPress={() => setAccessType('all')}
        >
          <Ionicons 
            name={accessType === 'all' ? "radio-button-on" : "radio-button-off"} 
            size={24} 
            color={accessType === 'all' ? COLORS.primary : colors.textTertiary} 
          />
          <View style={{ marginLeft: SPACING.md }}>
            <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>All Accounts</Text>
            <Text style={[styles.radioSub, { color: colors.textSecondary }]}>Member can see all current and future accounts.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.radioRow, { backgroundColor: colors.surface, marginTop: SPACING.sm }]} 
          onPress={() => setAccessType('custom')}
        >
          <Ionicons 
            name={accessType === 'custom' ? "radio-button-on" : "radio-button-off"} 
            size={24} 
            color={accessType === 'custom' ? COLORS.primary : colors.textTertiary} 
          />
          <View style={{ marginLeft: SPACING.md }}>
            <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>Select Specific Accounts</Text>
            <Text style={[styles.radioSub, { color: colors.textSecondary }]}>Manually choose which accounts to share.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.radioRow, { backgroundColor: colors.surface, marginTop: SPACING.sm }]} 
          onPress={() => setAccessType('none')}
        >
          <Ionicons 
            name={accessType === 'none' ? "radio-button-on" : "radio-button-off"} 
            size={24} 
            color={accessType === 'none' ? COLORS.primary : colors.textTertiary} 
          />
          <View style={{ marginLeft: SPACING.md }}>
            <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>No Access</Text>
            <Text style={[styles.radioSub, { color: colors.textSecondary }]}>Do not share any account access with this member.</Text>
          </View>
        </TouchableOpacity>

        {accessType === 'custom' && (
          <View style={{ marginTop: SPACING.xl }}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SELECT ACCOUNTS & ACCESS</Text>
            {personalAccounts.map(acc => {
              const perm = permissions.find(p => (p.accountId?._id || p.accountId) === acc._id) || { canView: false, canEdit: false };
              return (
                <View key={acc._id} style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.accountHeader}>
                    <Text style={{ fontSize: 20 }}>{acc.icon}</Text>
                    <Text style={[styles.accountName, { color: colors.textPrimary }]}>{acc.name}</Text>
                  </View>
                  
                  <View style={styles.permRow}>
                    <View style={styles.permItem}>
                      <Text style={[styles.permLabel, { color: colors.textSecondary }]}>Can View</Text>
                      <Switch 
                        value={perm.canView} 
                        onValueChange={() => togglePermission(acc._id, 'canView')}
                        trackColor={{ false: colors.border, true: `${COLORS.primary}80` }}
                        thumbColor={perm.canView ? COLORS.primary : '#f4f3f4'}
                      />
                    </View>
                    <View style={styles.permItem}>
                      <Text style={[styles.permLabel, { color: colors.textSecondary }]}>Can Edit</Text>
                      <Switch 
                        value={perm.canEdit} 
                        onValueChange={() => togglePermission(acc._id, 'canEdit')}
                        trackColor={{ false: colors.border, true: `${COLORS.primary}80` }}
                        thumbColor={perm.canEdit ? COLORS.primary : '#f4f3f4'}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Button title="Save Permissions" onPress={handleSave} type="primary" />
      </View>
    </View>
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
  scroll: { padding: SPACING.xl, paddingBottom: 100 },
  memberInfo: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  avatarText: { fontWeight: '800', fontSize: 24 },
  memberName: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  memberEmail: { fontSize: FONT_SIZES.sm, opacity: 0.6 },
  sectionTitle: { fontSize: 10, fontWeight: '800', marginBottom: SPACING.md, letterSpacing: 1 },
  radioRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderRadius: RADIUS.lg },
  radioLabel: { fontSize: 15, fontWeight: '700' },
  radioSub: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  accountCard: { padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  accountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  accountName: { marginLeft: SPACING.md, fontSize: 14, fontWeight: '700' },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: SPACING.sm },
  permItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permLabel: { fontSize: 12, fontWeight: '600' },
  footer: { padding: SPACING.xl, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 }
});
