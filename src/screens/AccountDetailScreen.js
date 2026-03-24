import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, Dimensions, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function AccountDetailScreen({ navigation, route }) {
  const { accountId } = route.params;
  const { colors, isDark } = useTheme();
  const { accounts, archivedAccounts, fetchAccounts, fetchArchivedAccounts } = useAccounts();
  const { transactions, summary, loading, fetchTransactions, fetchSummary } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);

  const account = accounts.find(a => a._id === accountId) || archivedAccounts.find(a => a._id === accountId);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchAccounts(),
      fetchArchivedAccounts(),
      fetchSummary({ account: accountId, month, year }),
      fetchTransactions({ 
        account: accountId, 
        limit: 50,
        startDate: format(new Date(year, month - 1, 1), 'yyyy-MM-dd'),
        endDate: format(new Date(year, month, 0), 'yyyy-MM-dd')
      })
    ]);
  }, [accountId, month, year, fetchAccounts, fetchArchivedAccounts, fetchSummary, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!account && !loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Account not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  if (loading && !refreshing && !account) return <LoadingSpinner message="Loading account details..." />;

  const displayLogo = account?.bankLogo || BANK_LIST.find(b => b.name === account?.bankName || b.name === account?.name)?.logo;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Account Details</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Account Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: account?.color || COLORS.primary }, SHADOWS.md]}>
          <View style={styles.heroTop}>
            <View style={styles.iconContainer}>
              {displayLogo ? (
                <Image source={{ uri: displayLogo }} style={styles.bankLogo} resizeMode="contain" />
              ) : (
                <Text style={styles.emojiIcon}>{account?.icon || '💳'}</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {account?.isArchived && (
                <View style={[styles.typeBadge, { backgroundColor: COLORS.expense }]}>
                  <Text style={styles.typeText}>DELETED</Text>
                </View>
              )}
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{(account?.type || 'cash').toUpperCase()}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.accountName}>{account?.name}</Text>
          <Text style={styles.bankNameText}>
            {account?.isShared ? `Owner: ${account.ownerName || 'Family Member'}` : (account?.bankName || 'Personal Account')}
          </Text>
          
          <View style={styles.heroStatsRow}>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>₹{account?.balance?.toLocaleString() || '0'}</Text>
            </View>
            <View style={styles.prevBalanceContainer}>
              <Text style={styles.balanceLabel}>Last Month Balance</Text>
              <Text style={styles.prevBalanceValue}>₹{summary?.previousBalance?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Third Party Breakdown */}
        {account?.otherPersons?.length > 0 && (
          <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>Third-Party Breakdown</Text>
            </View>
            
            {account.otherPersons.map((person, idx) => (
              <View key={idx} style={styles.breakdownRow}>
                <Text style={[styles.personName, { color: colors.textSecondary }]}>{person.name}</Text>
                <Text style={[styles.personAmount, { color: colors.textPrimary }]}>₹{person.amount.toLocaleString()}</Text>
              </View>
            ))}

            <View style={[styles.breakdownTotalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Third-Party</Text>
              <Text style={[styles.totalValue, { color: '#FFB020' }]}>
                ₹{account.otherPersons.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.myBalanceRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>My Actual Balance</Text>
              <Text style={[styles.totalValue, { color: COLORS.income }]}>
                ₹{(account.balance - account.otherPersons.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons - Hidden for Archived or Read-Only */}
        {!account?.isArchived && account?.canEdit !== false && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AddTransaction', { type: 'expense', account: accountId })}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.expense}15` }]}>
                <Ionicons name="arrow-up" size={20} color={COLORS.expense} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AddTransaction', { type: 'income', account: accountId })}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.income}15` }]}>
                <Ionicons name="arrow-down" size={20} color={COLORS.income} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AddTransaction', { type: 'transfer', account: accountId })}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Transfer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions', { account: accountId })}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm }}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            transactions.map((txn) => (
              <TransactionItem
                key={txn._id}
                transaction={txn}
                onPress={() => navigation.navigate('TransactionDetail', { transaction: txn })}
              />
            ))
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              subtitle="Transactions for this account will appear here"
            />
          )}
        </View>

        <View style={{ height: SPACING['3xl'] }} />
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
  editBtn: { padding: 4 },
  scroll: { padding: SPACING.xl },
  heroCard: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    minHeight: 180,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bankLogo: { width: 32, height: 32 },
  emojiIcon: { fontSize: 24 },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  accountName: {
    color: '#fff',
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  bankNameText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  balanceContainer: {
    flex: 1,
  },
  prevBalanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  prevBalanceValue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  historySection: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  breakdownCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  breakdownTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  personName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  personAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  myBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
});
