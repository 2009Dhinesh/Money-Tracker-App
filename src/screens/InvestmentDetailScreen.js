import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useInvestments } from '../hooks/useInvestments';
import { useAlert } from '../context/AlertContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

const TYPES = [
  { label: 'Stock', value: 'stock', icon: 'trending-up' },
  { label: 'Crypto', value: 'crypto', icon: 'logo-bitcoin' },
  { label: 'Mutual Fund', value: 'mutual_fund', icon: 'stats-chart' },
  { label: 'Bond', value: 'bond', icon: 'document-text' },
];

export default function InvestmentDetailScreen({ navigation, route }) {
  const { investment } = route.params || {};
  const { colors, isDark } = useTheme();
  const { removeInvestment } = useInvestments();
  const { alert: showAlert } = useAlert();

  if (!investment) return null;

  const invType = TYPES.find(t => t.value === investment.type) || { label: 'Asset', value: 'asset', icon: 'cube' };
  const isProfit = investment.profit >= 0;

  const handleDelete = () => {
    showAlert('Delete Investment', 'Are you sure you want to delete this investment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeInvestment(investment._id);
          navigation.goBack();
        },
      },
    ], 'warning');
  };

  const DetailRow = ({ icon, label, value, subValue, color }) => (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: color ? `${color}15` : colors.surfaceAlt }]}>
        <Ionicons name={icon} size={20} color={color || colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{value}</Text>
        {subValue && <Text style={[styles.rowSubValue, { color: colors.textTertiary }]}>{subValue}</Text>}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Investment Details</Text>
        <TouchableOpacity style={styles.headerRight} onPress={() => navigation.navigate('Investments', { editInvestment: investment })}>
          <Ionicons name="pencil" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.md]}>
          <View style={[styles.typeBadge, { backgroundColor: `${COLORS.primary}15` }]}>
            <Ionicons name={invType.icon} size={14} color={COLORS.primary} />
            <Text style={[styles.typeText, { color: COLORS.primary }]}>{invType.label}</Text>
          </View>

          <Text style={[styles.invName, { color: colors.textPrimary }]}>{investment.name}</Text>
          {investment.symbol && (
            <Text style={[styles.invSymbol, { color: colors.textTertiary }]}>{investment.symbol}</Text>
          )}

          <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
            ₹{investment.totalValue?.toLocaleString()}
          </Text>

          <View style={[styles.profitBadge, { backgroundColor: isProfit ? `${COLORS.income}15` : `${COLORS.expense}15` }]}>
            <Ionicons name={isProfit ? 'trending-up' : 'trending-down'} size={14} color={isProfit ? COLORS.income : COLORS.expense} />
            <Text style={[styles.profitText, { color: isProfit ? COLORS.income : COLORS.expense }]}>
              {isProfit ? '+' : ''}₹{Math.abs(investment.profit || 0).toLocaleString()} ({investment.profitPercentage?.toFixed(2) || 0}%)
            </Text>
          </View>
        </View>

        {/* Details Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Asset Information</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
          <DetailRow 
            icon="albums-outline" 
            label="Holding Units" 
            value={`${investment.units} Units`}
          />
          <DetailRow 
            icon="pricetag-outline" 
            label="Average Buy Price" 
            value={`₹${investment.buyPrice?.toLocaleString()}`}
          />
          <DetailRow 
            icon="analytics-outline" 
            label="Current Price" 
            value={`₹${(investment.currentPrice || investment.buyPrice)?.toLocaleString()}`}
          />
          <DetailRow 
            icon="cash-outline" 
            label="Total Invested Amount" 
            value={`₹${((investment.units || 0) * (investment.buyPrice || 0)).toLocaleString()}`}
          />
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={[styles.deleteBtn, { borderColor: COLORS.expense }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
          <Text style={styles.deleteBtnText}>Delete Investment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
  },
  menuIconWrap: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerRight: { width: 40, height: 40 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  scroll: { padding: SPACING.xl },
  amountCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    marginBottom: SPACING.sm,
  },
  typeText: { fontSize: FONT_SIZES.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  invName: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  invSymbol: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginTop: 2, marginBottom: SPACING.base },
  totalValue: { fontSize: 36, fontWeight: '900', marginVertical: SPACING.sm },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 6,
    marginTop: SPACING.xs,
  },
  profitText: { fontSize: FONT_SIZES.sm, fontWeight: '800' },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    marginBottom: SPACING.md,
    letterSpacing: -0.2,
  },
  card: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rowLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: 2 },
  rowValue: { fontSize: FONT_SIZES.md, fontWeight: '700' },
  rowSubValue: { fontSize: FONT_SIZES.xs, marginTop: 2 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    marginTop: SPACING.base,
    marginBottom: SPACING['3xl'],
  },
  deleteBtnText: { color: COLORS.expense, fontSize: FONT_SIZES.base, fontWeight: '700' },
});
