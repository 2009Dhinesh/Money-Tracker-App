import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAlert } from '../context/AlertContext';

import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DeletedAccountsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { archivedAccounts, fetchArchivedAccounts, unarchiveAccount, removeAccount, loading } = useAccounts();

  const { alert: showAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      fetchArchivedAccounts();
    }, [fetchArchivedAccounts])
  );

  const handleRestore = (id) => {
    showAlert(
      'Restore Account',
      'This will move the account back to your active accounts list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          onPress: async () => {
            try {
              await unarchiveAccount(id);
              showAlert('Success', 'Account restored!', [], 'success');
            } catch (err) {
              showAlert('Error', err.message, [], 'error');
            }
          }
        }
      ],
      'info'
    );
  };

  const handlePermanentDelete = (id) => {
    showAlert(
      'Permanent Delete',
      'Warning: This will delete ALL transactions linked to this account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await removeAccount(id);
              showAlert('Success', 'Account and records deleted forever.', [], 'success');
            } catch (err) {
              showAlert('Error', err.response?.data?.message || err.message, [], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  if (loading && archivedAccounts.length === 0) return <LoadingSpinner />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Deleted Accounts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {archivedAccounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No deleted accounts found</Text>
          </View>
        ) : (
          archivedAccounts.map((acc) => (
            <TouchableOpacity 
              key={acc._id} 
              onPress={() => navigation.navigate('AccountDetail', { accountId: acc._id })}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            >
              <View style={[styles.cardIcon, { backgroundColor: `${acc.color}18` }]}>
                {(() => {
                  const logoFromList = BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                  const displayLogo = acc.bankLogo || logoFromList;
                  
                  if (displayLogo) {
                     return <Image source={{ uri: displayLogo }} style={styles.logoImage} resizeMode="contain" />;
                  }
                  return <Text style={{ fontSize: 24 }}>{acc.icon}</Text>;
                })()}
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{acc.name}</Text>
                <Text style={[styles.type, { color: colors.textSecondary }]}>ARCHIVED • {acc.type.toUpperCase()}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleRestore(acc._id)} style={[styles.actionBtn, { backgroundColor: `${COLORS.income}15` }]}>
                  <Ionicons name="refresh-outline" size={18} color={COLORS.income} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePermanentDelete(acc._id)} style={[styles.actionBtn, { backgroundColor: `${COLORS.expense}15` }]}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 56, 
    paddingBottom: SPACING.md, 
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: SPACING.md,
    padding: 2,
  },
  scroll: { padding: SPACING.xl },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderRadius: RADIUS.xl,
    borderWidth: 1, marginBottom: SPACING.base,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 32, height: 32 },
  cardInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  type: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: FONT_SIZES.base, fontWeight: '600', marginTop: SPACING.md },
});
