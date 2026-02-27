import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import debtApi from '../api/debtApi';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: COLORS.warning, bg: COLORS.warningLight, icon: 'time-outline' },
  partial: { label: 'Partial', color: '#2F80ED', bg: '#EBF3FF', icon: 'pie-chart-outline' },
  completed: { label: 'Completed', color: COLORS.income, bg: COLORS.incomeLight, icon: 'checkmark-circle' },
};

export default function DebtDetailScreen({ navigation, route }) {
  const { debtId } = route.params;
  const { colors, isDark } = useTheme();
  const [debt, setDebt] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDebt = async () => {
    try {
      const res = await debtApi.getDebt(debtId);
      setDebt(res.debt);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDebt(); }, [debtId]);

  if (loading || !debt) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary }}>Loading...</Text>
      </View>
    );
  }

  const sc = STATUS_CONFIG[debt.status];
  const progress = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'completed';
  const isGiven = debt.type === 'given';

  const getBankLogo = (accObj) => {
    if (!accObj) return null;
    return accObj.bankLogo || BANK_LIST.find(b => b.name === accObj.bankName || b.name === accObj.name)?.logo;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isGiven ? COLORS.expense : COLORS.income }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroPersonRow}>
              <View style={styles.heroAvatar}>
                <Text style={{ fontSize: 28 }}>{debt.contact?.icon || '👤'}</Text>
              </View>
              <View>
                <Text style={styles.heroName}>{debt.contact?.name}</Text>
                <Text style={styles.heroType}>{isGiven ? '💸 Money Given' : '💰 Money Borrowed'}</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Ionicons name={sc.icon} size={12} color="#fff" />
              <Text style={styles.statusPillText}>{sc.label}</Text>
            </View>
          </View>

          <Text style={styles.heroAmount}>₹{debt.totalAmount.toLocaleString()}</Text>

          {/* Progress */}
          <View style={styles.heroProgressBg}>
            <View style={[styles.heroProgressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <View style={styles.heroRow}>
            <Text style={styles.heroMeta}>Paid: ₹{debt.paidAmount.toLocaleString()}</Text>
            <Text style={styles.heroMeta}>Left: ₹{debt.remainingAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Date</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {new Date(debt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Due Date</Text>
              <Text style={[styles.infoValue, { color: isOverdue ? COLORS.expense : colors.textPrimary }]}>
                {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Payment</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {debt.paymentMethod === 'cash' ? '💵 Cash' : '🏦 Bank'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Contact</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {debt.contact?.phone || debt.contact?.relation || '-'}
              </Text>
            </View>
          </View>

          {debt.paymentMethod === 'bank' && debt.bankAccount && (
            <View style={[styles.bankRow, { backgroundColor: colors.surfaceAlt }]}>
              {getBankLogo(debt.bankAccount) ? (
                <Image source={{ uri: getBankLogo(debt.bankAccount) }} style={{ width: 20, height: 20 }} resizeMode="contain" />
              ) : (
                <Text>{debt.bankAccount.icon}</Text>
              )}
              <Text style={[styles.bankText, { color: colors.textPrimary }]}>{debt.bankAccount.name}</Text>
              {debt.transferMode ? <Text style={[styles.bankMeta, { color: colors.textTertiary }]}>{debt.transferMode === 'upi' ? `UPI${debt.upiApp ? ` · ${debt.upiApp}` : ''}` : 'Transfer'}</Text> : null}
            </View>
          )}

          {debt.note ? (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Note</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{debt.note}</Text>
            </View>
          ) : null}
        </View>

        {/* Repayment History */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          📜 Payment History ({debt.repayments?.length || 0})
        </Text>

        {(!debt.repayments || debt.repayments.length === 0) ? (
          <View style={[styles.emptyHistory, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="receipt-outline" size={32} color={colors.textTertiary} />
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm }}>No payments recorded yet</Text>
          </View>
        ) : (
          debt.repayments.map((r, idx) => (
            <View key={r._id || idx} style={[styles.repayCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
              <View style={styles.repayTop}>
                <View style={[styles.repayIdx, { backgroundColor: `${COLORS.income}15` }]}>
                  <Text style={{ color: COLORS.income, fontWeight: '800', fontSize: FONT_SIZES.sm }}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.repayAmount, { color: COLORS.income }]}>+₹{r.amount.toLocaleString()}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>
                    {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={[styles.repayMethodBadge, { backgroundColor: colors.surfaceAlt, color: colors.textSecondary }]}>
                  {r.paymentMethod === 'cash' ? '💵 Cash' : '🏦 Bank'}
                </Text>
              </View>
              {r.note ? <Text style={[styles.repayNote, { color: colors.textTertiary }]}>📝 {r.note}</Text> : null}
            </View>
          ))
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.xl },
  // Hero
  heroCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  heroPersonRow: { flexDirection: 'row', alignItems: 'center' },
  heroAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  heroName: { color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: '800' },
  heroType: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.sm, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusPillText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },
  heroAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: SPACING.md },
  heroProgressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  heroMeta: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZES.sm, fontWeight: '600' },
  // Info
  infoCard: { borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, marginBottom: SPACING.xl },
  infoRow: { flexDirection: 'row', gap: SPACING.base, marginBottom: SPACING.md },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.sm },
  bankText: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  bankMeta: { fontSize: FONT_SIZES.xs, marginLeft: 'auto' },
  // Section
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', marginBottom: SPACING.md },
  emptyHistory: { alignItems: 'center', padding: SPACING.xl, borderRadius: RADIUS.lg },
  // Repayment  
  repayCard: { borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, marginBottom: SPACING.sm },
  repayTop: { flexDirection: 'row', alignItems: 'center' },
  repayIdx: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  repayAmount: { fontSize: FONT_SIZES.base, fontWeight: '800' },
  repayMethodBadge: { fontSize: FONT_SIZES.xs, fontWeight: '600', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, overflow: 'hidden' },
  repayNote: { fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
});
