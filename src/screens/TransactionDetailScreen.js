import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';

const { width } = Dimensions.get('window');

export default function TransactionDetailScreen({ navigation, route }) {
  const { transaction } = route.params || {};
  const { colors, isDark } = useTheme();
  const { removeTransaction } = useTransactions();

  if (!transaction) return null;

  const isExpense = transaction.type === 'expense';
  const category = transaction.category;
  const account = transaction.account;
  const pm = transaction.paymentMethod;

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeTransaction(transaction._id);
          navigation.goBack();
        },
      },
    ]);
  };

  const DetailRow = ({ icon, label, value, subValue, color, image }) => (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: color ? `${color}15` : colors.surfaceAlt }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.bankLogo} resizeMode="contain" />
        ) : (
          <Ionicons name={icon} size={20} color={color || colors.textSecondary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{value}</Text>
        {subValue && <Text style={[styles.rowSubValue, { color: colors.textTertiary }]}>{subValue}</Text>}
      </View>
    </View>
  );

  const getAccountLogo = (acc) => {
    if (!acc) return null;
    const logoFromList = BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
    return acc.bankLogo || logoFromList;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* ── Header ─────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transaction Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddTransaction', { transaction, isEdit: true })}
          style={[styles.editBtn, { backgroundColor: `${COLORS.primary}15` }]}
        >
          <Ionicons name="pencil" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Amount Card ────────────────────────── */}
        <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.md]}>
          <View style={[styles.typeBadge, { 
            backgroundColor: transaction.type === 'expense' ? COLORS.expenseLight : 
                             transaction.type === 'income' ? COLORS.incomeLight : 
                             `${COLORS.primary}15` 
          }]}>
            <Ionicons 
              name={transaction.type === 'expense' ? 'arrow-down' : transaction.type === 'income' ? 'arrow-up' : 'swap-horizontal'} 
              size={14} 
              color={transaction.type === 'expense' ? COLORS.expense : transaction.type === 'income' ? COLORS.income : COLORS.primary} 
            />
            <Text style={[styles.typeText, { 
              color: transaction.type === 'expense' ? COLORS.expense : transaction.type === 'income' ? COLORS.income : COLORS.primary 
            }]}>
              {transaction.type.toUpperCase()}
            </Text>
          </View>
          
          <Text style={[styles.amount, { color: transaction.type === 'expense' ? COLORS.expense : transaction.type === 'income' ? COLORS.income : COLORS.primary }]}>
            {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
          </Text>
          
          <Text style={[styles.txnTitle, { color: colors.textPrimary }]}>{transaction.title}</Text>
          {transaction.description ? (
            <Text style={[styles.txnDesc, { color: colors.textSecondary }]}>{transaction.description}</Text>
          ) : null}
        </View>

        {/* ── Info Section ────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DetailRow 
            icon="calendar-outline" 
            label="Date & Time" 
            value={formatDate(transaction.date)} 
            subValue={formatTime(transaction.date)}
          />
          
          {transaction.type !== 'transfer' && (
            <DetailRow 
              icon="grid-outline" 
              label="Category" 
              value={category?.name || 'Uncategorized'} 
              color={category?.color}
            />
          )}

          {/* Account Detail Integration based on Type */}
          {transaction.type === 'transfer' ? (
            <>
              <DetailRow 
                label="From Account" 
                value={transaction.account?.name}
                color={transaction.account?.color}
                image={getAccountLogo(transaction.account)}
              />
              <DetailRow 
                label="To Account" 
                value={transaction.toAccount?.name}
                color={transaction.toAccount?.color}
                image={getAccountLogo(transaction.toAccount)}
              />
            </>
          ) : (
            <>
              <DetailRow 
                label={transaction.type === 'expense' ? 'Paid From' : 'Received In'} 
                value={account?.name || 'Unknown'}
                color={account?.color}
                image={getAccountLogo(account)}
              />
              {pm && (
                <DetailRow 
                  icon="card-outline" 
                  label="Payment Method" 
                  value={pm.name} 
                  subValue={pm.type}
                />
              )}
            </>
          )}

          {transaction.isRecurring && (
            <DetailRow 
              icon="refresh-outline" 
              label="Recurring Pattern" 
              value={`Auto ${transaction.frequency}`}
              color={COLORS.primary}
            />
          )}
        </View>

        {/* ── Actions ────────────────────────────── */}
        <TouchableOpacity 
          style={[styles.deleteBtn, { borderColor: COLORS.expense }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
          <Text style={styles.deleteText}>Delete Transaction</Text>
        </TouchableOpacity>
        
        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.xl },
  amountCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.xl,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  amount: { fontSize: 36, fontWeight: '800', marginBottom: SPACING.sm },
  txnTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', textAlign: 'center' },
  txnDesc: { fontSize: FONT_SIZES.sm, marginTop: 4, textAlign: 'center' },
  section: { borderRadius: RADIUS.xl, borderWidth: 1, paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bankLogo: { width: 24, height: 24 },
  rowLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  rowSubValue: { fontSize: FONT_SIZES.xs, marginTop: 1 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderStyle: 'dashed',
  },
  deleteText: { color: COLORS.expense, fontWeight: '700', fontSize: FONT_SIZES.base },
});
