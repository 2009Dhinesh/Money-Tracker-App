import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatCurrencyShort, formatFullNumber } from '../utils/formatters';
import { COLORS, RADIUS, SPACING, FONT_SIZES, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

const BalanceCard = ({ balance, income, expense, month, otherPersonsTotal = 0, incomeCount = 0, expenseCount = 0 }) => {
  const { colors, isDark } = useTheme();
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  
  const myBalance = balance - otherPersonsTotal;

  const gradientColors = isDark
    ? ['#1A1044', '#3D2B8E', '#6C63FF']
    : ['#4338CA', '#6C63FF', '#8B5CF6'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, SHADOWS.lg]}
    >
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Month label */}
      <View style={styles.topRow}>
        <Text style={styles.monthLabel}>{month || 'This Month'}</Text>
        {otherPersonsTotal > 0 && (
          <View style={styles.otherIndicator}>
            <Text style={styles.otherIndicatorText}>Incl. Third-Party</Text>
          </View>
        )}
      </View>

      {/* Balance */}
      <View style={styles.balanceContainer}>
        <View style={{ flex: 1.2 }}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text
            style={styles.balance}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatFullNumber(balance)}
          </Text>
        </View>

        {otherPersonsTotal > 0 && (
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>My Balance</Text>
              <Text style={styles.breakdownValue}>{formatCurrencyShort(myBalance)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Others</Text>
              <Text style={[styles.breakdownValue, { color: '#FFD700' }]}>{formatCurrencyShort(otherPersonsTotal)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Savings Rate */}
      {savingsRate > 0 && (
        <View style={styles.savingsRow}>
          <Ionicons name="trending-up" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.savingsText}>{savingsRate}% savings rate</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Income & Expense Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(0,200,150,0.2)' }]}>
            <Ionicons name="arrow-down-circle" size={18} color={COLORS.income} />
          </View>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: COLORS.income }]}>
              {formatFullNumber(income)}
            </Text>
            {incomeCount > 0 && (
              <Text style={styles.statCount}>{incomeCount} transactions</Text>
            )}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255,107,107,0.2)' }]}>
            <Ionicons name="arrow-up-circle" size={18} color={COLORS.expense} />
          </View>
          <View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: COLORS.expense }]}>
              {formatFullNumber(expense)}
            </Text>
            {expenseCount > 0 && (
              <Text style={styles.statCount}>{expenseCount} transactions</Text>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -40,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: 20,
  },
  monthLabel: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  balance: {
    fontSize: FONT_SIZES['5xl'],
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  savingsText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: SPACING.base + 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  statCount: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginTop: 1,
  },
  separator: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: SPACING.base,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  otherIndicator: { backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  otherIndicatorText: { color: '#FFD700', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  balanceContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  breakdownContainer: { flex: 0.8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, padding: 8, gap: 4 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' },
  breakdownValue: { fontSize: 12, color: '#FFF', fontWeight: '700' },
});

export default BalanceCard;
