import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, Alert, Image
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

  const DetailRow = ({ icon, label, value, subValue, color, image, emoji }) => (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: color ? `${color}15` : colors.surfaceAlt }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.bankLogo} resizeMode="contain" />
        ) : emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.menuIconWrap}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transaction Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddTransaction', { transaction, isEdit: true })}
          style={styles.headerRight}
        >
          <Ionicons name="pencil" size={24} color={COLORS.primary} />
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

          {/* Tags */}
          {transaction.tags && transaction.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {transaction.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tagChip, { backgroundColor: `${COLORS.primary}12` }]}>
                  <Text style={[styles.tagText, { color: COLORS.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
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
              emoji={category?.icon}
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
                subValue={transaction.account?.type}
                color={transaction.account?.color}
                image={getAccountLogo(transaction.account)}
              />
              <DetailRow 
                label="To Account" 
                value={transaction.toAccount?.name}
                subValue={transaction.toAccount?.type}
                color={transaction.toAccount?.color}
                image={getAccountLogo(transaction.toAccount)}
              />
            </>
          ) : (
            <>
              <DetailRow 
                label={transaction.type === 'expense' ? 'Paid From' : 'Received In'} 
                value={account?.name || 'Unknown'}
                subValue={account?.type}
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
              {transaction.autoReplenishments && transaction.autoReplenishments.length > 0 && transaction.autoReplenishments.map((rep, idx) => (
                <DetailRow
                  key={`rep-${idx}`}
                  icon="arrow-undo-outline"
                  label={`Auto-Paid to ${rep.personName}`}
                  value={formatCurrency(rep.amount)}
                  color={COLORS.warning}
                />
              ))}
              {transaction.autoReplenishments && transaction.autoReplenishments.length > 0 && (
                <DetailRow
                  icon="wallet-outline"
                  label="Added to My Balance"
                  value={formatCurrency(
                    transaction.amount - transaction.autoReplenishments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
                  )}
                  color={COLORS.primary}
                />
              )}
              {(() => {
                const person = transaction.account?.otherPersons?.find(
                  p => p._id?.toString() === transaction.otherPersonId?.toString()
                );
                if (person) {
                  return (
                    <DetailRow 
                      icon="person-outline" 
                      label="Third Party" 
                      value={person.name} 
                      subValue={`Current Share: ${formatCurrency(person.amount)}`}
                      color={COLORS.primary}
                    />
                  );
                }
                return null;
              })()}
            </>
          )}

          {transaction.isRecurring && (
            <DetailRow 
              icon="refresh-outline" 
              label="Recurring" 
              value={`Every ${transaction.frequency}`}
              subValue={transaction.nextOccurrence ? `Next: ${formatDate(transaction.nextOccurrence)}` : undefined}
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: SPACING.xl, 
    paddingTop: 56, 
    paddingBottom: SPACING.base, 
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: SPACING.base,
    padding: 2,
  },
  headerRight: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.base,
    padding: 2,
  },
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
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.base, justifyContent: 'center' },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tagText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  section: { borderRadius: RADIUS.xl, borderWidth: 1, paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bankLogo: { width: 24, height: 24 },
  emoji: { fontSize: 22 },
  rowLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  rowSubValue: { fontSize: FONT_SIZES.xs, marginTop: 1 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderStyle: 'dashed',
  },
  deleteText: { color: COLORS.expense, fontWeight: '700', fontSize: FONT_SIZES.base },
});
